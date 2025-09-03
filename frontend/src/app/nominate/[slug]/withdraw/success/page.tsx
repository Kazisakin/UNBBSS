'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaEnvelope } from 'react-icons/fa';

export default function NominationSuccess() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-4 text-green-400">
            Nomination Withdrawal Submitted Successfully!
          </h1>

          <div className="bg-green-600/20 border border-green-600/20 rounded-lg p-6 mb-6">
            <p className="text-green-100 mb-4">
              Your nomination withdrawal has been recorded and you should receive a confirmation email shortly.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-green-200">
              <FaEnvelope className="text-sm" />
              <span className="text-sm">Check your email for confirmation details and withdrawal information</span>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3 text-white">What happens next?</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• You'll receive a confirmation email with your submission details</li>
              <li>• The email will include a withdrawal link if you need to make changes</li>
              <li>• You can only withdraw or modify during the designated withdrawal period</li>
              <li>• Keep the confirmation email safe for your records</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <FaHome className="mr-2" />
              Return to Home
            </Button>
            
            <p className="text-gray-400 text-sm">
              Thank you for participating in the nomination Withdrawal process!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}