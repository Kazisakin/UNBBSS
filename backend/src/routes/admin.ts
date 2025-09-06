import express from 'express';
import { adminAuth, authRateLimit, AuthRequest, requireAdmin } from '../middleware/adminAuth';
import { 
  adminLogin,
  adminLogout,
  getProfile,
  createNominationEvent, 
  getEvents,
  updateEventTimeSettings,
  createVotingEvent,
  getVotingEvents,
  getVotingResults,
  getNominationSuggestions,
  getEventSubmissions,
  exportEventData,
  updateEvent,
  updateVotingEvent,
  deleteVotingEvent,
  extendVotingPeriod
} from '../controllers/adminController';

const router = express.Router();

// Debug middleware to log all admin route requests
router.use((req, res, next) => {
  console.log(`Admin Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Public authentication routes (with rate limiting)
router.post('/login', authRateLimit, adminLogin);

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin routes are working!', 
    timestamp: new Date().toISOString(),
    path: req.originalUrl 
  });
});

// Protected routes (require authentication)
router.use(adminAuth); // Apply authentication middleware to all routes below

// Admin profile routes
router.get('/profile', getProfile);
router.post('/logout', adminLogout);

// Nomination Events routes - FIXED PATHS
router.get('/nomination-events', requireAdmin, getEvents);
router.post('/nomination-events', requireAdmin, createNominationEvent);
router.put('/nomination-events/:eventId', requireAdmin, updateEvent);
router.put('/nomination-events/:eventId/time-settings', requireAdmin, updateEventTimeSettings);
router.get('/nomination-events/:eventId/submissions', requireAdmin, getEventSubmissions);
router.get('/nomination-events/:eventId/export', requireAdmin, exportEventData);

// Voting Events routes - CORRECT PATHS
router.get('/voting-events', requireAdmin, getVotingEvents);
router.post('/voting-events', requireAdmin, createVotingEvent);
router.get('/voting-events/:eventId/results', requireAdmin, getVotingResults);
router.put('/voting-events/:eventId', requireAdmin, updateVotingEvent);
router.delete('/voting-events/:eventId', requireAdmin, deleteVotingEvent);
router.post('/voting-events/:eventId/extend', requireAdmin, extendVotingPeriod);

// Data and suggestions
router.get('/nomination-suggestions', requireAdmin, getNominationSuggestions);

// Debug route to test authentication
router.get('/auth-test', (req: AuthRequest, res) => {
  res.json({
    message: 'Authentication successful!',
    admin: req.admin,
    timestamp: new Date().toISOString()
  });
});

export default router;