'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaSpinner, FaUser, FaGraduationCap, FaIdCard } from 'react-icons/fa';

interface FormData {
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
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

export default function NominationForm() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    studentId: '',
    faculty: '',
    year: '',
    positions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePositionToggle = (position: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position]
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.studentId.trim()) return 'Student ID is required';
    if (!formData.faculty.trim()) return 'Faculty is required';
    if (!formData.year) return 'Year is required';
    if (formData.positions.length === 0) return 'Select at least one position';

    if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
      return 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
      return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(formData.faculty.trim())) {
      return 'Faculty can only contain letters, spaces, hyphens, and apostrophes';
    }
    if (!/^\d{7}$/.test(formData.studentId.trim())) {
      return 'Student ID must be exactly 7 digits';
    }
    if (parseInt(formData.studentId.trim()) <= 3000000) {
      return 'Student ID must be greater than 3000000';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submissionData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        studentId: formData.studentId.trim(),
        faculty: formData.faculty.trim(),
        year: formData.year,
        positions: formData.positions,
      };

      await apiClient.submitNomination(submissionData);
      router.push(`/nominate/${slug}/success`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit nomination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Nomination</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaUser className="text-green-500" />
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-white/90 mb-2">First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="block text-white/90 mb-2">Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaGraduationCap className="text-blue-500" />
                <h2 className="text-lg font-semibold">Academic Information</h2>
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Student ID *</Label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="1234567"
                    required
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                    inputMode="numeric"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-1">7-digit student ID (must be greater than 3000000)</p>
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Faculty *</Label>
                <Input
                  value={formData.faculty}
                  onChange={(e) => handleInputChange('faculty', e.target.value)}
                  placeholder="Computer Science"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Year of Study *</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year} className="text-white hover:bg-gray-600">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Position Selection */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-4">Positions *</h2>
                <p className="text-gray-400 text-sm mb-4">Select all positions you wish to be nominated for:</p>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {POSITIONS.map((position) => (
                    <motion.div
                      key={position}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                        formData.positions.includes(position)
                          ? 'bg-green-600/20 border-green-600/50'
                          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handlePositionToggle(position)}
                    >
                      <Checkbox
                        checked={formData.positions.includes(position)}
                        onChange={() => handlePositionToggle(position)}
                        className="pointer-events-none"
                      />
                      <Label className="text-white cursor-pointer flex-1">
                        {position}
                      </Label>
                    </motion.div>
                  ))}
                </div>
                
                {formData.positions.length > 0 && (
                  <p className="text-green-400 text-sm mt-3">
                    Selected: {formData.positions.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 text-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting Nomination...
                </>
              ) : (
                'Submit Nomination'
              )}
            </Button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            By submitting this form, you confirm that all information is accurate and you understand the responsibilities of the positions you're applying for.
          </p>
        </motion.div>
      </div>
    </div>
  );
}