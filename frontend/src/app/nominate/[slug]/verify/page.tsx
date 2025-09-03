'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaArrowLeft } from 'react-icons/fa';

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

  useEffect(() => {
    if (!shortCode) {
      router.push(`/nominate/${slug}`);
    }
  }, [shortCode, slug, router]);

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
    
    // Check if we have email
    if (needsEmail && !email.endsWith('@unb.ca')) {
      setError('Please enter a valid @unb.ca email address');
      return;
    }

    if (!shortCode || otp.some(digit => !digit)) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/nomination/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          shortCode, 
          otp: otp.join('') 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTimeout(() => {
          router.push(`/nominate/${slug}/form`);
        }, 500);
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
        <Button
          onClick={() => router.push(`/nominate/${slug}`)}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8 text-center"
        >
          <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
          
          {needsEmail ? (
            <div className="space-y-4 mb-6">
              <p className="text-gray-400">Please enter your email to continue:</p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@unb.ca"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button
                onClick={() => {
                  if (email.endsWith('@unb.ca')) {
                    setNeedsEmail(false);
                    setError('');
                  } else {
                    setError('Please enter a valid @unb.ca email');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </Button>
            </div>
          ) : (
            <>
              <p className="text-gray-400 mb-6">
                Enter the 6-digit code sent to <br />
                <span className="text-white font-semibold">{email}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-12 h-12 text-center text-xl font-bold bg-gray-700 border-gray-600"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.some(digit => !digit)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </form>

              <div className="mt-4">
                <Button
                  onClick={() => setNeedsEmail(true)}
                  variant="ghost"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Change email address
                </Button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-3 text-red-100 mt-4">
              {error}
            </div>
          )}

          <p className="text-gray-500 text-sm mt-4">
            Didn't receive the code? Check your spam folder or go back to request a new one.
          </p>
        </motion.div>
      </div>
    </div>
  );
}