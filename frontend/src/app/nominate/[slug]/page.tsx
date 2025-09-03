'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaSpinner, FaInfoCircle } from 'react-icons/fa';

interface EventDetails {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  isOpen: boolean;
  nominationStartTime: string;
  nominationEndTime: string;
}

export default function NominationLanding() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [slug]);

  const loadEventDetails = async () => {
    try {
      const response = await apiClient.getEventDetails(slug);
      setEvent(response.event);
    } catch (err: any) {
      setError(err.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !email) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await apiClient.requestNominationOtp(email, slug);
      router.push(`/nominate/${slug}/verify?shortCode=${response.shortCode}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-4">Event Not Found</h1>
          <p className="text-gray-400">{error}</p>
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
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          
          {event.description && (
            <p className="text-gray-300 mb-6">{event.description}</p>
          )}

          {event.rules && (
            <div className="bg-blue-600/20 border border-blue-600/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-100 mb-2">Rules & Guidelines</h3>
                  <p className="text-blue-200 text-sm whitespace-pre-line">{event.rules}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Nomination Period</h3>
            <p className="text-gray-400">
              {new Date(event.nominationStartTime).toLocaleString()} - {new Date(event.nominationEndTime).toLocaleString()}
            </p>
          </div>

          {!event.isOpen ? (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-red-100 mb-2">Nominations Closed</h3>
              <p className="text-red-200">The nomination period for this event has ended.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="block text-white/90 mb-2">
                  Enter your @unb.ca email to begin
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@unb.ca"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {error && (
                <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-3 text-red-100">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || !email}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending verification code...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}