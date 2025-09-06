'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { FaSpinner, FaUser, FaGraduationCap, FaIdCard, FaEnvelope, FaLock, FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';

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

interface ValidationErrors {
  [key: string]: string;
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

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [sessionExpired, setSessionExpired] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkSession();
  }, [slug, router]);

  const checkSession = async () => {
    setNetworkError(false);
    
    try {
      const response = await fetch('http://localhost:5000/api/nomination/session', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSession(data);
        setSessionExpired(false);
      } else if (response.status === 401) {
        setSessionExpired(true);
      } else {
        setError('Unable to verify your session. Please try again.');
      }
    } catch (err) {
      setNetworkError(true);
      setError('Network connection failed. Please check your internet connection.');
    }
    
    setLoading(false);
  };

  const validateField = (field: keyof FormData, value: string | string[]): string | null => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value || typeof value === 'string' && !value.trim()) {
          return `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        }
        if (typeof value === 'string' && !/^[a-zA-Z\s'-]+$/.test(value.trim())) {
          return `${field === 'firstName' ? 'First' : 'Last'} name can only contain letters, spaces, hyphens, and apostrophes`;
        }
        if (typeof value === 'string' && (value.trim().length < 2 || value.trim().length > 50)) {
          return `${field === 'firstName' ? 'First' : 'Last'} name must be between 2 and 50 characters`;
        }
        break;
      
      case 'studentId':
        if (!value || typeof value === 'string' && !value.trim()) {
          return 'Student ID is required';
        }
        if (typeof value === 'string' && !/^\d{7}$/.test(value.trim())) {
          return 'Student ID must be exactly 7 digits';
        }
        if (typeof value === 'string' && parseInt(value.trim()) <= 3000000) {
          return 'Student ID must be greater than 3000000';
        }
        break;
      
      case 'faculty':
        if (!value || typeof value === 'string' && !value.trim()) {
          return 'Faculty is required';
        }
        if (typeof value === 'string' && !/^[a-zA-Z\s'-]+$/.test(value.trim())) {
          return 'Faculty can only contain letters, spaces, hyphens, and apostrophes';
        }
        if (typeof value === 'string' && (value.trim().length < 2 || value.trim().length > 100)) {
          return 'Faculty name must be between 2 and 100 characters';
        }
        break;
      
      case 'year':
        if (!value) {
          return 'Year of study is required';
        }
        break;
      
      case 'positions':
        if (!Array.isArray(value) || value.length === 0) {
          return 'Select at least one position';
        }
        if (value.length > 6) {
          return 'You can select maximum 6 positions';
        }
        break;
    }
    
    return null;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Real-time validation for certain fields
    if (field === 'studentId' && value) {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const handlePositionToggle = (position: string) => {
    setFormData(prev => {
      const newPositions = prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position];
      
      // Clear positions validation error
      if (validationErrors.positions && newPositions.length > 0) {
        setValidationErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.positions;
          return newErrors;
        });
      }
      
      return { ...prev, positions: newPositions };
    });
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    Object.keys(formData).forEach(key => {
      const field = key as keyof FormData;
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setError('Please fix the errors below and try again.');
    return;
  }

  setSubmitting(true);
  setError('');
  setNetworkError(false);

  try {
    const submissionData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentId: formData.studentId.trim(),
      faculty: formData.faculty.trim(),
      year: formData.year,
      positions: formData.positions,
    };

    const response = await fetch('http://localhost:5000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (response.ok) {
      // Success - redirect to success page
      router.push(`/nominate/${slug}/success`);
    } else {
      // Handle different error types
      if (response.status === 401) {
        setSessionExpired(true);
        setError('Your session has expired. Please verify your email again.');
      } else if (
        response.status === 400 &&
        data.error === 'You have already submitted a nomination for this event'
      ) {
        // ✅ NEW: duplicate submission
        setError('You have already submitted a nomination for this event.');
      } else if (response.status === 400 && data.details) {
        // Handle validation errors from backend
        const backendErrors: ValidationErrors = {};
        data.details.forEach((issue: any) => {
          if (issue.path && issue.path.length > 0) {
            backendErrors[issue.path[0]] = issue.message;
          }
        });
        setValidationErrors(backendErrors);
        setError('Please fix the errors below and try again.');
      } else if (response.status === 403) {
        setError(data.error || 'You are not authorized to submit this nomination.');
      } else if (response.status === 429) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError(data.error || 'Failed to submit nomination. Please try again.');
      }
    }
  } catch (err: any) {
    setNetworkError(true);
    if (retryCount < 3) {
      setError(`Network error occurred. Retrying... (${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      setTimeout(() => handleSubmit(e), 2000);
      return;
    } else {
      setError('Network connection failed. Please check your internet connection and try again.');
    }
  } finally {
    setSubmitting(false);
  }
};


  const retrySession = () => {
    setLoading(true);
    checkSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-600/20 text-center"
        >
          <FaSpinner className="animate-spin text-green-600 w-8 h-8 mx-auto mb-4" />
          <p className="text-white">Loading your session...</p>
        </motion.div>
      </div>
    );
  }

  if (sessionExpired || !userSession) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 text-center max-w-md mx-4"
        >
          <FaExclamationTriangle className="text-red-400 text-4xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-4">
            {sessionExpired ? 'Session Expired' : 'Session Required'}
          </h1>
          <p className="text-gray-200 mb-6">
            {sessionExpired 
              ? 'Your verification session has expired. Please verify your email again to continue.'
              : 'Please verify your email first to access this form.'
            }
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push(`/nominate/${slug}`)} 
              className="w-full bg-green-600/80 hover:bg-green-700/80 backdrop-blur-sm"
            >
              Verify Email
            </Button>
            {networkError && (
              <Button 
                onClick={retrySession}
                variant="outline" 
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Retry Connection
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-2xl">
        <Button
          onClick={() => router.push(`/nominate/${slug}`)}
          variant="ghost"
          className="mb-6 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </Button>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-600/20 hover:border-red-500/20 transition duration-300"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-white">Complete Your Nomination</h1>
            <p className="text-white/80">for {userSession.eventName}</p>
          </motion.div>

          <div className="space-y-6">
            {/* Email Display - Grayed Out */}
            <motion.div variants={itemVariants}>
              <Label className="block text-white/90 mb-2">
                <FaEnvelope className="inline mr-2" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  value={userSession.email}
                  disabled
                  className="bg-white/5 border-white/20 text-white/60 cursor-not-allowed backdrop-blur-sm"
                />
                <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FaCheckCircle className="text-green-400 text-xs" />
                <p className="text-green-400 text-xs">This email was verified for this nomination</p>
              </div>
            </motion.div>

            {/* Personal Information */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaUser className="text-green-400" />
                <h2 className="text-lg font-semibold text-white">Personal Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-white/90 mb-2">First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                    className={`bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm ${
                      validationErrors.firstName ? 'border-red-400 bg-red-500/10' : ''
                    }`}
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <FaExclamationTriangle className="text-xs" />
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="block text-white/90 mb-2">Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                    className={`bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm ${
                      validationErrors.lastName ? 'border-red-400 bg-red-500/10' : ''
                    }`}
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <FaExclamationTriangle className="text-xs" />
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Academic Information */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaGraduationCap className="text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Academic Information</h2>
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Student ID *</Label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <Input
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="1234567"
                    required
                    className={`bg-white/10 border-white/30 text-white placeholder-white/50 pl-10 backdrop-blur-sm ${
                      validationErrors.studentId ? 'border-red-400 bg-red-500/10' : ''
                    }`}
                    inputMode="numeric"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FaInfoCircle className="text-white/40 text-xs" />
                  <p className="text-white/60 text-sm">7-digit student ID (must be greater than 3000000)</p>
                </div>
                {validationErrors.studentId && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {validationErrors.studentId}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Faculty *</Label>
                <Input
                  value={formData.faculty}
                  onChange={(e) => handleInputChange('faculty', e.target.value)}
                  placeholder="Computer Science"
                  required
                  className={`bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm ${
                    validationErrors.faculty ? 'border-red-400 bg-red-500/10' : ''
                  }`}
                />
                {validationErrors.faculty && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {validationErrors.faculty}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-white/90 mb-2">Year of Study *</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                  <SelectTrigger className={`bg-white/10 border-white/30 text-white backdrop-blur-sm ${
                    validationErrors.year ? 'border-red-400 bg-red-500/10' : ''
                  }`}>
                    <SelectValue placeholder="Select your year" className="placeholder-white/50" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800/90 border-white/30 backdrop-blur-lg">
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year} className="text-white hover:bg-white/10">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.year && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {validationErrors.year}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Position Selection */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-white">Positions *</h2>
                <div className="flex items-center gap-2 mb-4">
                  <FaInfoCircle className="text-blue-400 text-sm" />
                  <p className="text-white/80 text-sm">Select positions you wish to be nominated for (max 3):</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {POSITIONS.map((position) => (
                    <motion.div
                      key={position}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                        formData.positions.includes(position)
                          ? 'bg-green-600/20 border-green-400/50 shadow-lg shadow-green-500/10'
                          : 'bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10'
                      }`}
                      onClick={() => handlePositionToggle(position)}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        formData.positions.includes(position)
                          ? 'bg-green-600 border-green-600'
                          : 'border-white/40'
                      }`}>
                        {formData.positions.includes(position) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <Label className="text-white cursor-pointer flex-1 font-medium">
                        {position}
                      </Label>
                    </motion.div>
                  ))}
                </div>
                
                {formData.positions.length > 0 && (
                  <div className="bg-green-600/10 border border-green-400/30 rounded-lg p-3 mt-3 backdrop-blur-sm">
                    <p className="text-green-200 text-sm">
                      <strong>Selected ({formData.positions.length}/3):</strong> {formData.positions.join(', ')}
                    </p>
                  </div>
                )}

                {validationErrors.positions && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {validationErrors.positions}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-100 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{error}</p>
                    {networkError && (
                      <p className="text-sm mt-2 text-red-200">
                        Please check your internet connection and try again.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(validationErrors).length > 0}
                className="w-full bg-green-600/80 hover:bg-green-700/80 backdrop-blur-sm py-3 text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </motion.div>
          </div>

          <motion.p 
            variants={itemVariants}
            className="text-white/60 text-sm text-center mt-6"
          >
            By submitting this form, you confirm that all information is accurate and you understand the responsibilities of the positions you're applying for.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}