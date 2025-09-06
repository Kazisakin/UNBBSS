'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaSpinner, FaInfoCircle, FaVoteYea, FaUsers, FaClock } from 'react-icons/fa';

interface VotingEventDetails {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  isOpen: boolean;
  votingStartTime: string;
  votingEndTime: string;
  candidatesByPosition: Record<string, any[]>;
}

export default function VotingLanding() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<VotingEventDetails | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [slug]);

  const loadEventDetails = async () => {
    try {
      const response = await apiClient.getVotingEventDetails(slug);
      setEvent(response.event);
    } catch (err: any) {
      setError(err.message || 'Voting event not found');
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
      const response = await apiClient.requestVotingOtp(email, slug);
      router.push(`/vote/${slug}/verify?token=${response.token}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total candidates
  const totalCandidates = event ? 
    Object.values(event.candidatesByPosition).reduce((total, candidates) => total + candidates.length, 0) : 0;

  // Get positions with candidates
  const positionsWithCandidates = event ? 
    Object.entries(event.candidatesByPosition).filter(([_, candidates]) => candidates.length > 0) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-white"
        >
          <FaSpinner className="animate-spin text-green-600 w-8 h-8" />
          <span className="text-xl">Loading voting event...</span>
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8 text-center max-w-md border border-red-600/20"
        >
          <FaVoteYea className="text-red-500 text-4xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-4">Voting Event Not Found</h1>
          <p className="text-gray-400">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <FaVoteYea className="text-green-500 text-6xl mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
          {event.description && (
            <p className="text-gray-300 text-lg">{event.description}</p>
          )}
        </motion.div>

        {/* Event Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaClock className="text-blue-400" />
              <h3 className="font-semibold">Voting Period</h3>
            </div>
            <p className="text-gray-400 text-sm">
              {new Date(event.votingStartTime).toLocaleString()} 
              <br />to<br />
              {new Date(event.votingEndTime).toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-purple-400" />
              <h3 className="font-semibold">Candidates</h3>
            </div>
            <p className="text-gray-400 text-sm">
              {totalCandidates} candidates across {positionsWithCandidates.length} positions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-lg p-4 border ${
              event.isOpen 
                ? 'bg-green-900/20 border-green-600/50' 
                : 'bg-red-900/20 border-red-600/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaVoteYea className={event.isOpen ? 'text-green-400' : 'text-red-400'} />
              <h3 className="font-semibold">Status</h3>
            </div>
            <p className={`text-sm font-medium ${event.isOpen ? 'text-green-400' : 'text-red-400'}`}>
              {event.isOpen ? 'Voting is Open' : 'Voting is Closed'}
            </p>
          </motion.div>
        </div>

        {/* Rules Section */}
        {event.rules && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-600/20 border border-blue-600/20 rounded-lg p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-100 mb-3">Voting Rules & Guidelines</h3>
                <div className="text-blue-200 text-sm whitespace-pre-line leading-relaxed">
                  {event.rules}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaUsers className="text-purple-400" />
            Candidates Overview
          </h3>
          <div className="space-y-4">
            {positionsWithCandidates.map(([position, candidates]) => (
              <div key={position}>
                <h4 className="font-medium text-gray-300 mb-2">{position}</h4>
                <div className="flex flex-wrap gap-2">
                  {candidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <Badge className="bg-purple-600/20 border border-purple-600/30 text-purple-200 px-3 py-1">
                        {candidate.firstName} {candidate.lastName}
                        <span className="ml-2 text-xs opacity-75">
                          {candidate.faculty}, {candidate.year}
                        </span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                {candidates.length === 1 && (
                  <p className="text-yellow-400 text-xs mt-1 italic">
                    Single candidate - will be automatically selected
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Voting Access Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gray-800 rounded-lg p-8 border border-gray-700"
        >
          {!event.isOpen ? (
            <div className="text-center">
              <FaClock className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">Voting is Currently Closed</h3>
              <p className="text-gray-400">
                The voting period for this event has ended. Please check back for results.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-center mb-6">
                Cast Your Vote
              </h3>
              <p className="text-gray-400 text-center mb-8">
                Enter your @unb.ca email address to receive a secure verification code
              </p>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
                <div>
                  <Label className="block text-white/90 mb-2 text-lg">
                    Your Email Address
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@unb.ca"
                    required
                    className="w-full p-4 text-lg rounded-xl border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-0 transition-colors"
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Must be a valid @unb.ca email address
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 text-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <FaInfoCircle className="text-red-400 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={submitting || !email}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-3" />
                        Sending verification code...
                      </>
                    ) : (
                      <>
                        <FaVoteYea className="mr-3" />
                        Continue to Vote
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-8 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                <p className="text-yellow-200 text-sm text-center">
                  <strong>Security Notice:</strong> You'll receive a 6-digit verification code via email. 
                  This ensures only eligible voters can participate.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}