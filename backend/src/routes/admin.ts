import express from 'express';
import { adminAuth } from '../middleware/adminAuth';
import { 
  adminLogin, 
  createNominationEvent, 
  getEvents 
} from '../controllers/adminController';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes
router.use(adminAuth); // Apply auth middleware to all routes below

router.post('/events', createNominationEvent);
router.get('/events', getEvents);

export default router;