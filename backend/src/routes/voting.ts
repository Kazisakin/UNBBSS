import express from 'express';
import { 
  getVotingEventDetails, 
  requestVotingOtp, 
  verifyVotingOtp, 
  submitVote 
} from '../controllers/votingController';

const router = express.Router();

router.get('/event/:slug', getVotingEventDetails);
router.post('/request-otp', requestVotingOtp);
router.post('/verify-otp', verifyVotingOtp);
router.post('/submit', submitVote);

export default router;