'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaEnvelope, FaInfoCircle, FaDownload, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

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

const bounceVariants = {
  hidden: { scale: 0 },
  visible: { 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 10
    }
  }
};

export default function NominationSuccess() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-600/20 hover:border-green-500/30 transition duration-300 text-center"
        >
          <motion.div
            variants={bounceVariants}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <FaCheckCircle className="text-green-400 text-6xl mx-auto mb-4 drop-shadow-lg" />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold mb-4 text-green-300">
              Nomination Submitted Successfully!
            </h1>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-green-600/20 border border-green-400/30 rounded-lg p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FaEnvelope className="text-green-400 text-xl mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-green-200 font-semibold mb-2">Confirmation Email Sent</h3>
                <p className="text-green-100 text-sm mb-3">
                  Your nomination has been recorded and you should receive a confirmation email within the next few minutes.
                </p>
                <p className="text-green-200 text-sm">
                  The email will contain your submission details and a withdrawal link if needed.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <FaInfoCircle className="text-blue-400" />
                <h3 className="font-semibold text-white">What's Next?</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm text-left">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Check your email for confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Save the withdrawal link safely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Wait for the nomination period to close</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <FaCalendarAlt className="text-purple-400" />
                <h3 className="font-semibold text-white">Important Dates</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm text-left">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Withdrawal period will be announced</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Final candidate list publication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Voting period dates</span>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-orange-600/10 border border-orange-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-orange-200 font-semibold mb-2">Important Reminder</h3>
                <p className="text-orange-100 text-sm">
                  You can only withdraw or modify your nomination during the designated withdrawal period. 
                  Make sure to keep your confirmation email safe as it contains the withdrawal link.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm transition-all duration-300"
              >
                <FaHome className="mr-2" />
                Return to Home
              </Button>
              
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                <FaDownload className="mr-2" />
                Print Confirmation
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                onClick={() => router.push(`/nominate/${slug}`)}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                Submit Another Nomination
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/20">
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-3">Need Help?</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/80 mb-1">
                    <strong>Didn't receive the email?</strong>
                  </p>
                  <ul className="text-white/60 space-y-1">
                    <li>• Check your spam folder</li>
                    <li>• Wait 5-10 minutes</li>
                    <li>• Contact support if needed</li>
                  </ul>
                </div>
                <div>
                  <p className="text-white/80 mb-1">
                    <strong>Need to make changes?</strong>
                  </p>
                  <ul className="text-white/60 space-y-1">
                    <li>• Wait for withdrawal period</li>
                    <li>• Use the link in your email</li>
                    <li>• Or contact support</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-white/60 text-sm text-center mt-6"
          >
            Thank you for participating in the nomination process! Your contribution to student leadership is appreciated.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}