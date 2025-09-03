import express from 'express';
import { 
  requestOtp, 
  verifyOtp, 
  submitNomination, 
  getEventDetails 
} from '../controllers/nominationController';

const router = express.Router();

router.get('/event/:slug', getEventDetails);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/submit', submitNomination);

export default router;