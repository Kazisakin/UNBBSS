'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { FaSpinner, FaPlus, FaTimes, FaUser, FaLightbulb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateVotingEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

interface Candidate {
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
}

interface Suggestion {
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
  eventName: string;
}

const POSITIONS = [
  'President',
  'Vice President',
  'General Secretary',
  'Treasurer',
  'Event Coordinator',
  'Webmaster',
];

const YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
];

export default function CreateVotingEventModal({ isOpen, onClose, onEventCreated }: CreateVotingEventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    votingStartTime: '',
    votingEndTime: '',
    eligibleEmails: [] as string[],
    candidates: [] as Candidate[],
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [currentCandidate, setCurrentCandidate] = useState<Candidate>({
    firstName: '',
    lastName: '',
    studentId: '',
    faculty: '',
    year: '',
    positions: [],
  });
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const response = await apiClient.getNominationSuggestions();
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addEmail = () => {
    if (newEmail.trim() && newEmail.endsWith('@unb.ca')) {
      if (!formData.eligibleEmails.includes(newEmail.trim())) {
        setFormData(prev => ({
          ...prev,
          eligibleEmails: [...prev.eligibleEmails, newEmail.trim()]
        }));
      }
      setNewEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      eligibleEmails: prev.eligibleEmails.filter(e => e !== email)
    }));
  };

  const handleCandidateChange = (field: keyof Candidate, value: string | string[]) => {
    setCurrentCandidate(prev => ({ ...prev, [field]: value }));
  };

  const toggleCandidatePosition = (position: string) => {
    setCurrentCandidate(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position]
    }));
  };

  const addCandidate = () => {
    if (!currentCandidate.firstName || !currentCandidate.lastName || 
        !currentCandidate.studentId || !currentCandidate.faculty || 
        !currentCandidate.year || currentCandidate.positions.length === 0) {
      setError('Please fill all candidate fields and select at least one position');
      return;
    }

    if (!/^\d{7}$/.test(currentCandidate.studentId) || parseInt(currentCandidate.studentId) <= 3000000) {
      setError('Student ID must be 7 digits and greater than 3000000');
      return;
    }

    // Check for duplicate student ID
    if (formData.candidates.some(c => c.studentId === currentCandidate.studentId)) {
      setError('A candidate with this Student ID already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { ...currentCandidate }]
    }));

    setCurrentCandidate({
      firstName: '',
      lastName: '',
      studentId: '',
      faculty: '',
      year: '',
      positions: [],
    });
    setError('');
  };

  const addFromSuggestion = (suggestion: Suggestion) => {
    const candidate = {
      firstName: suggestion.firstName,
      lastName: suggestion.lastName,
      studentId: suggestion.studentId,
      faculty: suggestion.faculty,
      year: suggestion.year,
      positions: suggestion.positions as string[],
    };
    
    // Check for duplicate
    if (formData.candidates.some(c => c.studentId === candidate.studentId)) {
      setError('This candidate is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, candidate]
    }));
  };

  const removeCandidate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.votingStartTime || !formData.votingEndTime) {
        throw new Error('Name and voting times are required');
      }

      if (formData.eligibleEmails.length === 0) {
        throw new Error('At least one eligible email is required');
      }

      if (formData.candidates.length === 0) {
        throw new Error('At least one candidate is required');
      }

      // Validate time sequence
      const votingStart = new Date(formData.votingStartTime);
      const votingEnd = new Date(formData.votingEndTime);

      if (votingStart >= votingEnd) {
        throw new Error('Voting end time must be after start time');
      }

      const eventData = {
        name: formData.name,
        description: formData.description || undefined,
        rules: formData.rules || undefined,
        votingStartTime: votingStart.toISOString(),
        votingEndTime: votingEnd.toISOString(),
        eligibleEmails: formData.eligibleEmails,
        candidates: formData.candidates,
      };

      const response = await apiClient.createVotingEvent(eventData);
      onEventCreated(response.event);

      // Reset form
      setFormData({
        name: '',
        description: '',
        rules: '',
        votingStartTime: '',
        votingEndTime: '',
        eligibleEmails: [],
        candidates: [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create voting event');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format default dates
  const formatDatetimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultStartDate = formatDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const defaultEndDate = formatDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Voting Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-gray-700 mb-6">
              <TabsTrigger value="basic">Event Details</TabsTrigger>
              <TabsTrigger value="candidates">
                Candidates ({formData.candidates.length})
              </TabsTrigger>
              <TabsTrigger value="emails">
                Eligible Voters ({formData.eligibleEmails.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>Event Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Student Council Election 2024"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the voting event..."
                  className="bg-gray-700 border-gray-600 text-white min-h-20"
                />
              </div>

              <div>
                <Label>Rules & Guidelines</Label>
                <Textarea
                  value={formData.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  placeholder="Voting rules and guidelines..."
                  className="bg-gray-700 border-gray-600 text-white min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Voting Start Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.votingStartTime || defaultStartDate}
                    onChange={(e) => handleInputChange('votingStartTime', e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label>Voting End Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.votingEndTime || defaultEndDate}
                    onChange={(e) => handleInputChange('votingEndTime', e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Candidates</h3>
                <Button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  <FaLightbulb className="mr-2" />
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </Button>
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-700 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto"
                  >
                    <h4 className="text-sm font-semibold text-gray-300">From Recent Nominations:</h4>
                    {suggestions.slice(0, 10).map((suggestion, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-600 rounded text-sm">
                        <div>
                          <span className="font-medium">
                            {suggestion.firstName} {suggestion.lastName}
                          </span>
                          <span className="text-gray-300 ml-2">
                            ({suggestion.faculty}, {suggestion.year})
                          </span>
                          <div className="flex gap-1 mt-1">
                            {suggestion.positions.slice(0, 2).map(pos => (
                              <Badge key={pos} className="bg-blue-600 text-xs">{pos}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addFromSuggestion(suggestion)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Candidate Form */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold flex items-center">
                  <FaUser className="mr-2" />
                  Add New Candidate
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={currentCandidate.firstName}
                      onChange={(e) => handleCandidateChange('firstName', e.target.value)}
                      className="bg-gray-600 border-gray-500"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={currentCandidate.lastName}
                      onChange={(e) => handleCandidateChange('lastName', e.target.value)}
                      className="bg-gray-600 border-gray-500"
                    />
                  </div>
                  <div>
                    <Label>Student ID *</Label>
                    <Input
                      value={currentCandidate.studentId}
                      onChange={(e) => handleCandidateChange('studentId', e.target.value.replace(/\D/g, '').slice(0, 7))}
                      placeholder="1234567"
                      className="bg-gray-600 border-gray-500"
                    />
                  </div>
                  <div>
                    <Label>Faculty *</Label>
                    <Input
                      value={currentCandidate.faculty}
                      onChange={(e) => handleCandidateChange('faculty', e.target.value)}
                      className="bg-gray-600 border-gray-500"
                    />
                  </div>
                  <div>
                    <Label>Year *</Label>
                    <Select value={currentCandidate.year} onValueChange={(value) => handleCandidateChange('year', value)}>
                      <SelectTrigger className="bg-gray-600 border-gray-500">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-600">
                        {YEARS.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Positions * (select all that apply)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {POSITIONS.map(position => (
                      <div
                        key={position}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          currentCandidate.positions.includes(position)
                            ? 'bg-green-600 border-green-500'
                            : 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                        }`}
                        onClick={() => toggleCandidatePosition(position)}
                      >
                        <span className="text-sm">{position}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addCandidate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="mr-2" />
                  Add Candidate
                </Button>
              </div>

              {/* Candidates List */}
              {formData.candidates.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Added Candidates ({formData.candidates.length})</h4>
                  {formData.candidates.map((candidate, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700 rounded-lg p-4 flex justify-between items-start"
                    >
                      <div>
                        <h5 className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </h5>
                        <p className="text-gray-400 text-sm">
                          {candidate.studentId} | {candidate.faculty} | {candidate.year}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {candidate.positions.map(pos => (
                            <Badge key={pos} className="bg-green-600 text-xs">{pos}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeCandidate(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <FaTimes />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <div>
                <Label>Add Eligible Voter Email</Label>
                <div className="flex gap-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@unb.ca"
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  />
                  <Button type="button" onClick={addEmail} className="bg-blue-600">
                    <FaPlus />
                  </Button>
                </div>
              </div>

              {formData.eligibleEmails.length > 0 && (
                <div className="max-h-60 overflow-y-auto bg-gray-700 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.eligibleEmails.map((email) => (
                      <motion.div
                        key={email}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="hover:bg-green-700 rounded-full p-1"
                        >
                          <FaTimes size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-gray-400 text-sm mt-3">
                    {formData.eligibleEmails.length} voter{formData.eligibleEmails.length !== 1 ? 's' : ''} added
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-3 text-red-100 mt-4">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Voting Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}