'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaArrowLeft } from 'react-icons/fa';

export default function WithdrawVerify() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const slug = params.slug as string;
  const shortCode = searchParams.get('shortCode');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortCode) {
      router.push(`/nominate/${slug}/withdraw`);
    }
  }, [shortCode, slug, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

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
    if (!shortCode || otp.some(digit => !digit)) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/withdrawal/verify-otp', {
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
          router.push(`/nominate/${slug}/withdraw/form`);
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
          onClick={() => router.push(`/nominate/${slug}/withdraw`)}
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
          <h1 className="text-2xl font-bold mb-4">Verify Withdrawal</h1>
          <p className="text-gray-400 mb-6">
            Enter the 6-digit verification code sent to your email.
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

            {error && (
              <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-3 text-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
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

          <p className="text-gray-500 text-sm mt-4">
            Enter the code you received: <strong>949673</strong> (from your email)
          </p>
        </motion.div>
      </div>
    </div>
  );
}