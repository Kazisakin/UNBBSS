import express from 'express';
import { 
  requestOtp, 
  verifyOtp, 
  submitNomination, 
  getEventDetails,
  getSession  // Add this import
} from '../controllers/nominationController';

const router = express.Router();

router.get('/event/:slug', getEventDetails);
router.get('/session', getSession);  // Add this route
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/submit', submitNomination);

export default router;