'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpinner, FaArrowLeft, FaArrowRight, FaCheck, 
  FaVoteYea, FaUser, FaGraduationCap, FaUniversity,
  FaCalendarAlt, FaLock, FaEye
} from 'react-icons/fa';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
}

interface VotingEventDetails {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  candidatesByPosition: Record<string, Candidate[]>;
}

interface BallotData {
  voterFirstName: string;
  voterLastName: string;
  voterStudentId: string;
  voterFaculty: string;
  voterYear: string;
  ballot: Record<string, string>;
}

const YEARS = [
  '1st Year',
  '2nd Year', 
  '3rd Year',
  '4th Year',
  '5th Year',
];

const POSITIONS = [
  'President',
  'Vice President', 
  'General Secretary',
  'Treasurer',
  'Event Coordinator',
  'Webmaster',
];

export default function VotingBallot() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<VotingEventDetails | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ballotData, setBallotData] = useState<BallotData>({
    voterFirstName: '',
    voterLastName: '',
    voterStudentId: '',
    voterFaculty: '',
    voterYear: '',
    ballot: {},
  });
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get positions that have candidates
  const availablePositions = event ? 
    POSITIONS.filter(position => 
      event.candidatesByPosition[position] && 
      event.candidatesByPosition[position].length > 0
    ) : [];

  const totalSteps = availablePositions.length + 1; // +1 for voter info
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    loadEventDetails();
  }, [slug]);

  const loadEventDetails = async () => {
    try {
      const response = await apiClient.getVotingEventDetails(slug);
      setEvent(response.event);

      // Pre-populate ballot for single candidates (auto-selected)
      const ballot: Record<string, string> = {};
      Object.entries(response.event.candidatesByPosition).forEach(([position, candidates]) => {
        if (candidates && Array.isArray(candidates) && candidates.length === 1) {
          ballot[position] = candidates[0].id;
        }
      });
      setBallotData(prev => ({ ...prev, ballot }));
    } catch (err: any) {
      setError('Failed to load voting event');
      setTimeout(() => router.push(`/vote/${slug}`), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BallotData, value: string) => {
    setBallotData(prev => ({ ...prev, [field]: value }));
  };

  const handleCandidateSelect = (position: string, candidateId: string) => {
    setBallotData(prev => ({
      ...prev,
      ballot: { ...prev.ballot, [position]: candidateId }
    }));
  };

  const canProceed = () => {
    if (currentStep === 0) {
      // Voter info step
      return ballotData.voterFirstName &&
             ballotData.voterLastName &&
             ballotData.voterStudentId &&
             ballotData.voterFaculty &&
             ballotData.voterYear;
    } else {
      // Position voting step
      const position = availablePositions[currentStep - 1];
      return ballotData.ballot[position]; // Must have selected a candidate
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!event) return;

    setSubmitting(true);
    setError('');

    try {
      // Validate student ID
      if (!/^\d{7}$/.test(ballotData.voterStudentId) || parseInt(ballotData.voterStudentId) <= 3000000) {
        throw new Error('Student ID must be 7 digits and greater than 3000000');
      }

      // Ensure all positions have selections
      const requiredPositions = availablePositions.filter(position => 
        event.candidatesByPosition[position].length > 1 // Only positions with multiple candidates
      );

      for (const position of requiredPositions) {
        if (!ballotData.ballot[position]) {
          throw new Error(`Please select a candidate for ${position}`);
        }
      }

      await apiClient.submitVote(ballotData);
      
      // Success - redirect to confirmation page
      router.push(`/vote/${slug}/confirmation`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-white"
        >
          <FaSpinner className="animate-spin text-green-600 w-8 h-8" />
          <span className="text-xl">Loading ballot...</span>
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md border border-red-600/20 text-white">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Invalid voting session or event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-gray-400">Secure Digital Ballot</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8"
        >
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!showPreview ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl"
            >
              {currentStep === 0 ? (
                // Voter Information Step
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <FaUser className="text-green-500 text-2xl" />
                    <h2 className="text-2xl font-bold">Your Information</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/90 mb-2 block">First Name *</Label>
                        <Input
                          value={ballotData.voterFirstName}
                          onChange={(e) => handleInputChange('voterFirstName', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white h-12"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <Label className="text-white/90 mb-2 block">Last Name *</Label>
                        <Input
                          value={ballotData.voterLastName}
                          onChange={(e) => handleInputChange('voterLastName', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white h-12"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block">Student ID *</Label>
                      <Input
                        value={ballotData.voterStudentId}
                        onChange={(e) => handleInputChange('voterStudentId', e.target.value.replace(/\D/g, '').slice(0, 7))}
                        className="bg-gray-700 border-gray-600 text-white h-12"
                        placeholder="1234567"
                      />
                      <p className="text-gray-400 text-sm mt-1">Must be 7 digits and greater than 3000000</p>
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block">Faculty *</Label>
                      <Input
                        value={ballotData.voterFaculty}
                        onChange={(e) => handleInputChange('voterFaculty', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white h-12"
                        placeholder="Enter your faculty"
                      />
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block">Academic Year *</Label>
                      <Select 
                        value={ballotData.voterYear} 
                        onValueChange={(value) => handleInputChange('voterYear', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-12">
                          <SelectValue placeholder="Select your year" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {YEARS.map(year => (
                            <SelectItem key={year} value={year} className="text-white hover:bg-gray-600">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                // Position Voting Step
                (() => {
                  const position = availablePositions[currentStep - 1];
                  const candidates = event.candidatesByPosition[position] || [];
                  const isSingleCandidate = candidates.length === 1;
                  
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <FaVoteYea className="text-purple-500 text-2xl" />
                        <div>
                          <h2 className="text-2xl font-bold">{position}</h2>
                          <p className="text-gray-400">
                            {isSingleCandidate ? 'Single candidate - automatically selected' : 'Choose one candidate'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {candidates.map((candidate) => {
                          const isSelected = ballotData.ballot[position] === candidate.id;
                          return (
                            <motion.div
                              key={candidate.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: isSingleCandidate ? 1 : 1.02 }}
                              whileTap={{ scale: isSingleCandidate ? 1 : 0.98 }}
                              className={`p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-green-600/20 border-green-500 shadow-lg shadow-green-500/20'
                                  : isSingleCandidate
                                  ? 'bg-yellow-600/20 border-yellow-500 cursor-default'
                                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                              }`}
                              onClick={() => !isSingleCandidate && handleCandidateSelect(position, candidate.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xl font-semibold text-white">
                                      {candidate.firstName} {candidate.lastName}
                                    </h3>
                                    {isSelected && !isSingleCandidate && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-green-500 rounded-full p-1"
                                      >
                                        <FaCheck className="text-white w-3 h-3" />
                                      </motion.div>
                                    )}
                                    {isSingleCandidate && (
                                      <Badge className="bg-yellow-600/20 border border-yellow-600/30 text-yellow-200">
                                        Auto-selected
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <FaUser className="text-blue-400" />
                                      <span>{candidate.studentId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <FaUniversity className="text-purple-400" />
                                      <span>{candidate.faculty}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <FaGraduationCap className="text-green-400" />
                                      <span>{candidate.year}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {!isSingleCandidate && (
                                  <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-green-500 border-green-500' 
                                      : 'border-gray-500'
                                  }`}>
                                    {isSelected && <FaCheck className="text-white w-3 h-3 m-0.5" />}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </motion.div>
          ) : (
            // Preview Step
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaEye className="text-blue-500 text-2xl" />
                <h2 className="text-2xl font-bold">Review Your Ballot</h2>
              </div>

              {/* Voter Info */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-400 mb-3">Voter Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{ballotData.voterFirstName} {ballotData.voterLastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Student ID:</span>
                    <span className="text-white ml-2">{ballotData.voterStudentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Faculty:</span>
                    <span className="text-white ml-2">{ballotData.voterFaculty}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white ml-2">{ballotData.voterYear}</span>
                  </div>
                </div>
              </div>

              {/* Vote Selections */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purple-400">Your Votes</h3>
                {availablePositions.map((position) => {
                  const selectedCandidateId = ballotData.ballot[position];
                  const candidate = event.candidatesByPosition[position]?.find(c => c.id === selectedCandidateId);
                  const isSingle = event.candidatesByPosition[position]?.length === 1;
                  
                  return (
                    <div key={position} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-white">{position}</h4>
                          {candidate && (
                            <p className="text-green-400">
                              {candidate.firstName} {candidate.lastName}
                              {isSingle && (
                                <Badge className="ml-2 bg-yellow-600/20 border border-yellow-600/30 text-yellow-200 text-xs">
                                  Auto-selected
                                </Badge>
                              )}
                            </p>
                          )}
                        </div>
                        <FaCheck className="text-green-500" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-600/20 border border-blue-600/20 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <FaLock className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-200 text-sm">
                      <strong>Final Confirmation:</strong> Once submitted, your vote cannot be changed. 
                      Your ballot will be encrypted and securely recorded. You will receive a confirmation email.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 mt-4 text-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {showPreview ? (
            <Button
              onClick={() => setShowPreview(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Edit
            </Button>
          ) : (
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <FaArrowLeft className="mr-2" />
              Previous
            </Button>
          )}

          {showPreview ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <FaVoteYea className="mr-2" />
                    Submit My Vote
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  Review Ballot
                  <FaEye className="ml-2" />
                </>
              ) : (
                <>
                  Next
                  <FaArrowRight className="ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}