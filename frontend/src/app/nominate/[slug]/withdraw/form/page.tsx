'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle, FaLock } from 'react-icons/fa';

interface NominationDetails {
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
  eventName: string;
}

export default function WithdrawForm() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [nomination, setNomination] = useState<NominationDetails | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadNominationDetails();
  }, []);

  const loadNominationDetails = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/withdrawal/details', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNomination(data.nomination);
        setSelectedPositions(data.nomination.positions); // Start with all positions selected
      } else {
        router.push(`/nominate/${slug}/withdraw`);
      }
    } catch (err) {
      router.push(`/nominate/${slug}/withdraw`);
    } finally {
      setLoading(false);
    }
  };

  const handlePositionToggle = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

 const handleSubmit = async () => {
  setSubmitting(true);
  setError('');

  console.log('Submitting withdrawal with positions:', selectedPositions);

  try {
    const requestBody = { positions: selectedPositions };
    console.log('Request body:', requestBody);

    const response = await fetch('http://localhost:5000/api/withdrawal/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Response:', { status: response.status, data });

    if (response.ok) {
      router.push(`/nominate/${slug}/withdraw/success`);
    } else {
      setError(data.error || 'Failed to process withdrawal');
      if (data.details) {
        console.log('Validation details:', data.details);
      }
    }
  } catch (err) {
    console.error('Network error:', err);
    setError('Network error. Please try again.');
  } finally {
    setSubmitting(false);
    setShowPreview(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <FaSpinner className="animate-spin text-yellow-600 w-8 h-8" />
      </div>
    );
  }

  if (!nomination) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-4">Session Required</h1>
          <p className="text-gray-400 mb-4">Please verify your email first.</p>
          <Button onClick={() => router.push(`/nominate/${slug}/withdraw`)} className="bg-yellow-600 hover:bg-yellow-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const withdrawnPositions = nomination.positions.filter(pos => !selectedPositions.includes(pos));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <div className="text-center mb-8">
            <FaExclamationTriangle className="text-yellow-500 text-3xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Modify Your Nomination</h1>
            <p className="text-gray-400">for {nomination.eventName}</p>
          </div>

          <div className="space-y-6">
            {/* Current Nomination Details - Read Only */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Current Nomination Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-gray-400 text-sm">Email</Label>
                  <div className="flex items-center">
                    <Input value={nomination.email} disabled className="bg-gray-600/50 text-gray-300" />
                    <FaLock className="ml-2 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <Label className="block text-gray-400 text-sm">Student ID</Label>
                  <Input value={nomination.studentId} disabled className="bg-gray-600/50 text-gray-300" />
                </div>
                
                <div>
                  <Label className="block text-gray-400 text-sm">Name</Label>
                  <Input value={`${nomination.firstName} ${nomination.lastName}`} disabled className="bg-gray-600/50 text-gray-300" />
                </div>
                
                <div>
                  <Label className="block text-gray-400 text-sm">Faculty</Label>
                  <Input value={nomination.faculty} disabled className="bg-gray-600/50 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Position Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Positions to Keep</h2>
              <p className="text-gray-400 text-sm mb-4">
                Uncheck positions you want to withdraw from. Checked positions will remain in your nomination.
              </p>
              
              <div className="grid md:grid-cols-2 gap-3">
                {nomination.positions.map((position) => (
                  <motion.div
                    key={position}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedPositions.includes(position)
                        ? 'bg-green-600/20 border-green-600/50'
                        : 'bg-red-600/20 border-red-600/50'
                    }`}
                    onClick={() => handlePositionToggle(position)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedPositions.includes(position)
                        ? 'bg-green-600 border-green-600'
                        : 'border-red-400 bg-red-600/20'
                    }`}>
                      {selectedPositions.includes(position) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <Label className={`cursor-pointer flex-1 ${
                      selectedPositions.includes(position) ? 'text-green-100' : 'text-red-100'
                    }`}>
                      {position}
                    </Label>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedPositions.includes(position) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {selectedPositions.includes(position) ? 'Keep' : 'Withdraw'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-600/20 border border-blue-600/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-100 mb-2">Summary</h3>
              <div className="text-sm text-blue-200">
                {selectedPositions.length > 0 ? (
                  <p><strong>Keeping:</strong> {selectedPositions.join(', ')}</p>
                ) : (
                  <p className="text-red-200"><strong>Complete withdrawal from all positions</strong></p>
                )}
                {withdrawnPositions.length > 0 && (
                  <p className="mt-1"><strong>Withdrawing from:</strong> {withdrawnPositions.join(', ')}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 text-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => setShowPreview(true)}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                Preview Changes
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-4">Confirm Withdrawal</h3>
              
              <div className="space-y-3 mb-6">
                <p><strong>Event:</strong> {nomination.eventName}</p>
                <p><strong>Your Name:</strong> {nomination.firstName} {nomination.lastName}</p>
                
                {selectedPositions.length > 0 ? (
                  <div>
                    <p><strong>Positions to Keep:</strong></p>
                    <p className="text-green-400">{selectedPositions.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-red-400"><strong>Complete withdrawal from all positions</strong></p>
                )}
                
                {withdrawnPositions.length > 0 && (
                  <div>
                    <p><strong>Withdrawing From:</strong></p>
                    <p className="text-red-400">{withdrawnPositions.join(', ')}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}