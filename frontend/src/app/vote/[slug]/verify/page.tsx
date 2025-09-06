'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaArrowLeft, FaShieldAlt, FaEnvelope } from 'react-icons/fa';

export default function VotingVerify() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const slug = params.slug as string;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !email) {
      router.push(`/vote/${slug}`);
    }
  }, [token, email, slug, router]);

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
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === 'Enter' && otp.every(digit => digit)) {
      handleSubmit(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || otp.some(digit => !digit)) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/voting/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          token, 
          otp: otp.join('') 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add a brief success animation before redirect
        setTimeout(() => {
          router.push(`/vote/${slug}/ballot`);
        }, 1000);
      } else {
        setError(data.error || 'Invalid verification code');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={() => router.push(`/vote/${slug}`)}
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Event
          </Button>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700 shadow-2xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <FaShieldAlt className="text-green-500 text-5xl mx-auto" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4"
          >
            Verify Your Identity
          </motion.h1>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaEnvelope className="text-blue-400" />
              <p className="text-gray-400">Code sent to:</p>
            </div>
            <p className="text-white font-semibold text-lg">{email}</p>
            <p className="text-gray-500 text-sm mt-2">
              Enter the 6-digit verification code to access your ballot
            </p>
          </motion.div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <Label className="block text-white/90 mb-4 text-lg">Verification Code</Label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Input
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                        digit 
                          ? 'bg-green-600/20 border-green-500 text-green-100' 
                          : 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus:border-green-500'
                      } focus:ring-0`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 text-red-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={loading || otp.some(digit => !digit)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue to Ballot'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg"
          >
            <p className="text-blue-200 text-sm">
              <strong>Didn't receive the code?</strong> Check your spam folder or go back to request a new one.
              The code expires in 30 minutes.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}