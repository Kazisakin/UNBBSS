'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaSpinner, FaUser, FaGraduationCap, FaIdCard, FaEnvelope, FaLock } from 'react-icons/fa';

interface FormData {
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
}

interface UserSession {
  email: string;
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

export default function NominationForm() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    studentId: '',
    faculty: '',
    year: '',
    positions: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has valid session from verification
    checkSession();
  }, [slug, router]);

const checkSession = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/nomination/session', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      setUserSession(data);
    } else {
      router.push(`/nominate/${slug}`);
      return;
    }
  } catch (err) {
    router.push(`/nominate/${slug}`);
    return;
  }
  
  setLoading(false);
};
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

  setSubmitting(true);
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

    // Use direct fetch instead of apiClient to ensure cookies are sent
    const response = await fetch('http://localhost:5000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Crucial for sending cookies
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (response.ok) {
      router.push(`/nominate/${slug}/success`);
    } else {
      setError(data.error || 'Failed to submit nomination');
    }
  } catch (err: any) {
    setError('Network error. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <FaSpinner className="animate-spin text-green-600 w-8 h-8" />
      </div>
    );
  }

  if (!userSession) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-4">Session Required</h1>
          <p className="text-gray-400 mb-4">Please verify your email first to access this form.</p>
          <Button onClick={() => router.push(`/nominate/${slug}`)} className="bg-green-600 hover:bg-green-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Nomination</h1>
          <p className="text-center text-gray-400 mb-6">for {userSession.eventName}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Display - Grayed Out */}
            <div className="space-y-4">
              <div>
                <Label className="block text-white/90 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    value={userSession.email}
                    disabled
                    className="bg-gray-600/50 border-gray-500 text-gray-300 cursor-not-allowed"
                  />
                  <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xs mt-1">This email was verified for this nomination</p>
              </div>
            </div>

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

            {/* Position Selection - Fixed without Checkbox component */}
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
                      {/* Custom checkbox replacement */}
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        formData.positions.includes(position)
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-400'
                      }`}>
                        {formData.positions.includes(position) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
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
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
            >
              {submitting ? (
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