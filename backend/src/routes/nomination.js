"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nominationController_1 = require("../controllers/nominationController");
const router = express_1.default.Router();
router.get('/event/:slug', nominationController_1.getEventDetails);
router.get('/session', nominationController_1.getSession); // Add this route
router.post('/request-otp', nominationController_1.requestOtp);
router.post('/verify-otp', nominationController_1.verifyOtp);
router.post('/submit', nominationController_1.submitNomination);
exports.default = router;
//# sourceMappingURL=nomination.js.map