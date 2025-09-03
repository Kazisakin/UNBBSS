'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function WithdrawLanding() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const slug = params.slug as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid withdrawal link. Please use the link from your confirmation email.');
    }
  }, [token]);

  const handleRequestOtp = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/withdrawal/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/nominate/${slug}/withdraw/verify?shortCode=${data.shortCode}`);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8 text-center"
        >
          <div className="mb-6">
            <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Withdraw Nomination</h1>
            <p className="text-gray-400">
              You're about to withdraw or modify your nomination. This action will require email verification.
            </p>
          </div>

          {error ? (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 mb-6">
              <p className="text-red-100">{error}</p>
            </div>
          ) : (
            <div className="bg-yellow-600/20 border border-yellow-600/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-100 text-sm">
                <strong>Important:</strong> You can only withdraw during the designated withdrawal period. 
                A verification code will be sent to your registered email address.
              </p>
            </div>
          )}

          <Button
            onClick={handleRequestOtp}
            disabled={loading || !token}
            className="w-full bg-yellow-600 hover:bg-yellow-700 mb-4"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Sending verification...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  );
}