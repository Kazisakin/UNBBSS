'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaShieldAlt, FaHome } from 'react-icons/fa';

export default function VotingConfirmation() {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    // Clear any voting session data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('votingSession');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 10,
            delay: 0.2
          }}
          className="mb-8"
        >
          <div className="relative">
            <FaCheckCircle className="text-green-500 text-8xl mx-auto" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="absolute -top-2 -right-2"
            >
              <div className="bg-green-500 rounded-full p-3">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            Vote Successfully Submitted!
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Thank you for participating in the democratic process.
          </p>
          <p className="text-gray-400">
            Your vote has been securely recorded and encrypted.
          </p>
        </motion.div>

        {/* Confirmation Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-700"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <FaEnvelope className="text-blue-400 text-2xl" />
            <h2 className="text-xl font-semibold">Confirmation Email</h2>
          </div>
          
          <div className="bg-blue-600/20 border border-blue-600/20 rounded-lg p-6">
            <p className="text-blue-200 leading-relaxed">
              A detailed receipt has been sent to your email containing:
            </p>
            <ul className="text-blue-200 text-left mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Your voter information and submission details
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Complete record of your candidate selections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Secure vote ID for your records
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Timestamp of submission
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Security Assurance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-green-600/20 border border-green-600/20 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaShieldAlt className="text-green-400 text-xl" />
            <h3 className="text-lg font-semibold text-green-300">Security & Privacy</h3>
          </div>
          <div className="text-green-200 text-sm space-y-2">
            <p>✓ Your vote has been encrypted using industry-standard security</p>
            <p>✓ All voting data is stored securely and accessed only by authorized administrators</p>
            <p>✓ Your vote cannot be changed or deleted after submission</p>
            <p>✓ The voting system maintains complete audit trails for transparency</p>
          </div>
        </motion.div>

        {/* Animation Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          {/* Confetti Animation */}
          <div className="relative overflow-hidden h-32 mb-8">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: -20,
                  opacity: 0,
                }}
                animate={{
                  y: 150,
                  opacity: [0, 1, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg"
              >
                <FaHome className="mr-2" />
                Return to Home
              </Button>
            </motion.div>
            
            <p className="text-gray-500 text-sm">
              Results will be announced after the voting period ends.
            </p>
          </div>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 p-6 bg-gray-800/50 rounded-lg border border-gray-700"
        >
          <p className="text-gray-400 text-sm leading-relaxed">
            Your participation helps ensure a fair and democratic election process. 
            If you have any concerns about this voting event or need assistance, 
            please contact the election administrators.
          </p>
        </motion.div>
      </div>
    </div>
  );
}