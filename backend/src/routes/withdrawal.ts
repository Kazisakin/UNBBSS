import * as express from 'express';
import { 
  requestWithdrawalOtp, 
  verifyWithdrawalOtp, 
  getNominationDetails, 
  submitWithdrawal 
} from '../controllers/withdrawalController';

const router = express.Router();

router.post('/request-otp', requestWithdrawalOtp);
router.post('/verify-otp', verifyWithdrawalOtp);
router.get('/details', getNominationDetails);
router.post('/submit', submitWithdrawal);

export default router;