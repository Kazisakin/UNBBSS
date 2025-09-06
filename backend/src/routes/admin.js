"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../middleware/adminAuth");
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
// Debug middleware to log all admin route requests
router.use((req, res, next) => {
    console.log(`Admin Route: ${req.method} ${req.originalUrl}`);
    next();
});
// Public authentication routes (with rate limiting)
router.post('/login', adminAuth_1.authRateLimit, adminController_1.adminLogin);
// Test route to verify routing works
router.get('/test', (req, res) => {
    res.json({
        message: 'Admin routes are working!',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
});
// Protected routes (require authentication)
router.use(adminAuth_1.adminAuth); // Apply authentication middleware to all routes below
// Admin profile routes
router.get('/profile', adminController_1.getProfile);
router.post('/logout', adminController_1.adminLogout);
// Nomination Events routes - FIXED PATHS
router.get('/nomination-events', adminAuth_1.requireAdmin, adminController_1.getEvents);
router.post('/nomination-events', adminAuth_1.requireAdmin, adminController_1.createNominationEvent);
router.put('/nomination-events/:eventId', adminAuth_1.requireAdmin, adminController_1.updateEvent);
router.put('/nomination-events/:eventId/time-settings', adminAuth_1.requireAdmin, adminController_1.updateEventTimeSettings);
router.get('/nomination-events/:eventId/submissions', adminAuth_1.requireAdmin, adminController_1.getEventSubmissions);
router.get('/nomination-events/:eventId/export', adminAuth_1.requireAdmin, adminController_1.exportEventData);
// Voting Events routes - CORRECT PATHS
router.get('/voting-events', adminAuth_1.requireAdmin, adminController_1.getVotingEvents);
router.post('/voting-events', adminAuth_1.requireAdmin, adminController_1.createVotingEvent);
router.get('/voting-events/:eventId/results', adminAuth_1.requireAdmin, adminController_1.getVotingResults);
router.put('/voting-events/:eventId', adminAuth_1.requireAdmin, adminController_1.updateVotingEvent);
router.delete('/voting-events/:eventId', adminAuth_1.requireAdmin, adminController_1.deleteVotingEvent);
router.post('/voting-events/:eventId/extend', adminAuth_1.requireAdmin, adminController_1.extendVotingPeriod);
// Data and suggestions
router.get('/nomination-suggestions', adminAuth_1.requireAdmin, adminController_1.getNominationSuggestions);
// Debug route to test authentication
router.get('/auth-test', (req, res) => {
    res.json({
        message: 'Authentication successful!',
        admin: req.admin,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=admin.js.map