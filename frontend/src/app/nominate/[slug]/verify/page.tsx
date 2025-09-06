'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaEnvelope, FaClock, FaShieldAlt } from 'react-icons/fa';

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

export default function VerifyOtp() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const slug = params.slug as string;
  const shortCode = searchParams.get('shortCode');
  const emailParam = searchParams.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState(emailParam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsEmail, setNeedsEmail] = useState(!emailParam);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!shortCode) {
      router.push(`/nominate/${slug}`);
    }
  }, [shortCode, slug, router]);

  // Countdown timer for blocked state
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isBlocked && timeLeft === 0) {
      setIsBlocked(false);
      setAttempts(0);
    }
  }, [timeLeft, isBlocked]);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }

      // Clear error when user starts typing
      if (error && value) {
        setError('');
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    } else if (e.key === 'Enter' && otp.every(digit => digit !== '')) {
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      document.getElementById('otp-5')?.focus();
      setError('');
    }
  };

  const validateEmail = (emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@unb\.ca$/i;
    return emailRegex.test(emailToValidate.trim());
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isBlocked) {
    setError(`Too many attempts. Please wait ${Math.ceil(timeLeft / 60)} minutes before trying again.`);
    return;
  }

  // Check if we have email
  if (needsEmail) {
    if (!validateEmail(email)) {
      setError('Please enter a valid @unb.ca email address');
      return;
    }
    setNeedsEmail(false);
    setError('');
    return;
  }

  if (!shortCode || otp.some(digit => !digit)) {
    setError('Please enter the complete 6-digit code');
    return;
  }

  setLoading(true);
  setError('');
  setNetworkError(false);

  try {
    const response = await fetch('http://localhost:5000/api/nomination/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        shortCode, 
        otp: otp.join(''), 
        email: email.toLowerCase().trim()
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/nominate/${slug}/form`);
      }, 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (response.status === 429 || newAttempts >= 3) {
        setIsBlocked(true);
        setTimeLeft(5 * 60); // 5 minutes
        setError('Too many failed attempts. Please wait 5 minutes before trying again.');
      } else if (response.status === 401) {
        setError(`Invalid verification code. ${3 - newAttempts} attempts remaining.`);
      } else if (response.status === 404) {
        setError('Verification code has expired. Please request a new one.');
      } else if (
        response.status === 400 &&
        data.error === 'You have already submitted a nomination for this event'
      ) {
        // ✅ Duplicate submission case
        setError('You have already submitted a nomination for this event.');
      } else {
        setError(data.error || 'Invalid verification code. Please try again.');
      }
      
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    }
  } catch (err: any) {
    setNetworkError(true);
    if (retryCount < 2) {
      setError(`Network error occurred. Retrying... (${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      setTimeout(() => handleSubmit(e), 2000);
      return;
    } else {
      setError('Network connection failed. Please check your internet connection and try again.');
    }
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
  } finally {
    setLoading(false);
  }
};

  const handleResendCode = async () => {
    if (isBlocked) {
      setError(`Please wait ${Math.ceil(timeLeft / 60)} minutes before requesting a new code.`);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/nomination/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          slug: slug
        }),
      });

      if (response.ok) {
        setError('');
        setAttempts(0);
        setOtp(['', '', '', '', '', '']);
        // Don't show success message as user should check their email
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-600/20 text-center max-w-md mx-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-4" />
          </motion.div>
          <h1 className="text-xl font-bold text-white mb-2">Verification Successful!</h1>
          <p className="text-white/80 mb-4">Redirecting you to the nomination form...</p>
          <FaSpinner className="animate-spin text-green-400 mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-md">
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
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-600/20 hover:border-blue-500/20 transition duration-300 text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <FaShieldAlt className="text-blue-400 text-4xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Verify Your Email</h1>
          </motion.div>
          
          {needsEmail ? (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaEnvelope className="text-blue-400" />
                <p className="text-white/80">Please enter your email to continue:</p>
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="your.email@unb.ca"
                className="bg-white/10 border-white/30 text-white placeholder-white/50 backdrop-blur-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              <Button
                onClick={handleSubmit}
                disabled={!email.trim()}
                className="w-full bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm disabled:opacity-50"
              >
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <p className="text-white/80 mb-2">
                  Enter the 6-digit code sent to:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <FaEnvelope className="text-green-400 text-sm" />
                  <span className="text-white font-semibold">{email}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="block text-white/90 mb-4">Verification Code</Label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isBlocked || loading}
                        className={`w-12 h-12 text-center text-xl font-bold bg-white/10 border-white/30 text-white backdrop-blur-sm ${
                          isBlocked ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    ))}
                  </div>
                  
                  {isBlocked && timeLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <FaClock className="text-orange-400 text-sm" />
                      <p className="text-orange-300 text-sm">
                        Locked for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}
                  
                  {attempts > 0 && !isBlocked && (
                    <p className="text-yellow-300 text-sm mt-2">
                      {3 - attempts} attempts remaining
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || otp.some(digit => !digit) || isBlocked}
                  className="w-full bg-green-600/80 hover:bg-green-700/80 backdrop-blur-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : isBlocked ? (
                    'Temporarily Blocked'
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="space-y-2">
                  <Button
                    onClick={() => setNeedsEmail(true)}
                    variant="ghost"
                    className="text-sm text-white/60 hover:text-white hover:bg-white/10"
                    disabled={loading}
                  >
                    Change email address
                  </Button>
                  
                  <Button
                    onClick={handleResendCode}
                    variant="ghost"
                    className="text-sm text-white/60 hover:text-white hover:bg-white/10"
                    disabled={loading || isBlocked}
                  >
                    Resend verification code
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-100 backdrop-blur-sm mt-4"
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

          <motion.div variants={itemVariants} className="mt-6">
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/60 text-sm mb-2">
                <strong>Didn't receive the code?</strong>
              </p>
              <ul className="text-white/50 text-xs space-y-1 text-left">
                <li>• Check your spam/junk folder</li>
                <li>• Wait a few minutes for delivery</li>
                <li>• Click "Resend verification code" above</li>
                <li>• Ensure your @unb.ca email is correct</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}