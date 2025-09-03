'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { FaSpinner, FaPlus, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    nominationStartTime: '',
    nominationEndTime: '',
    withdrawalStartTime: '',
    withdrawalEndTime: '',
    eligibleEmails: [] as string[],
  });
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.nominationStartTime || !formData.nominationEndTime || 
          !formData.withdrawalStartTime || !formData.withdrawalEndTime) {
        throw new Error('All date fields and name are required');
      }

      if (formData.eligibleEmails.length === 0) {
        throw new Error('At least one eligible email is required');
      }

      // Validate time sequence
      const nomStart = new Date(formData.nominationStartTime);
      const nomEnd = new Date(formData.nominationEndTime);
      const withStart = new Date(formData.withdrawalStartTime);
      const withEnd = new Date(formData.withdrawalEndTime);

      if (nomStart >= nomEnd) {
        throw new Error('Nomination end time must be after start time');
      }

      if (withStart >= withEnd) {
        throw new Error('Withdrawal end time must be after start time');
      }

      // Create ISO strings for API
      const eventData = {
        name: formData.name,
        description: formData.description || undefined,
        rules: formData.rules || undefined,
        nominationStartTime: nomStart.toISOString(),
        nominationEndTime: nomEnd.toISOString(),
        withdrawalStartTime: withStart.toISOString(),
        withdrawalEndTime: withEnd.toISOString(),
        eligibleEmails: formData.eligibleEmails,
      };

      const response = await apiClient.createEvent(eventData);
      onEventCreated(response.event);

      // Reset form
      setFormData({
        name: '',
        description: '',
        rules: '',
        nominationStartTime: '',
        nominationEndTime: '',
        withdrawalStartTime: '',
        withdrawalEndTime: '',
        eligibleEmails: [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const formatDatetimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default dates (today + future dates)
  const defaultStartDate = formatDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const defaultEndDate = formatDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Next week

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Nomination Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <Label className="block text-white/90 mb-2">Event Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Student Council Election 2024"
              required
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="block text-white/90 mb-2">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the election..."
              className="bg-gray-700 border-gray-600 text-white min-h-20"
            />
          </div>

          {/* Rules */}
          <div>
            <Label className="block text-white/90 mb-2">Rules & Guidelines</Label>
            <Textarea
              value={formData.rules}
              onChange={(e) => handleInputChange('rules', e.target.value)}
              placeholder="Election rules and guidelines..."
              className="bg-gray-700 border-gray-600 text-white min-h-20"
            />
          </div>

          {/* Date/Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-white/90 mb-2">Nomination Start *</Label>
              <Input
                type="datetime-local"
                value={formData.nominationStartTime || defaultStartDate}
                onChange={(e) => handleInputChange('nominationStartTime', e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="block text-white/90 mb-2">Nomination End *</Label>
              <Input
                type="datetime-local"
                value={formData.nominationEndTime || defaultEndDate}
                onChange={(e) => handleInputChange('nominationEndTime', e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="block text-white/90 mb-2">Withdrawal Start *</Label>
              <Input
                type="datetime-local"
                value={formData.withdrawalStartTime || defaultEndDate}
                onChange={(e) => handleInputChange('withdrawalStartTime', e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="block text-white/90 mb-2">Withdrawal End *</Label>
              <Input
                type="datetime-local"
                value={formData.withdrawalEndTime || formatDatetimeLocal(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000))}
                onChange={(e) => handleInputChange('withdrawalEndTime', e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Eligible Emails */}
          <div>
            <Label className="block text-white/90 mb-2">Eligible Emails *</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="student@unb.ca"
                className="bg-gray-700 border-gray-600 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              />
              <Button
                type="button"
                onClick={addEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus />
              </Button>
            </div>
            
            {formData.eligibleEmails.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-gray-700 rounded-lg p-3">
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
                <div className="text-gray-400 text-sm mt-2">
                  {formData.eligibleEmails.length} email{formData.eligibleEmails.length !== 1 ? 's' : ''} added
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-3 text-red-100">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
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
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}