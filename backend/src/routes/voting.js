"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const votingController_1 = require("../controllers/votingController");
const router = express_1.default.Router();
router.get('/event/:slug', votingController_1.getVotingEventDetails);
router.post('/request-otp', votingController_1.requestVotingOtp);
router.post('/verify-otp', votingController_1.verifyVotingOtp);
router.post('/submit', votingController_1.submitVote);
exports.default = router;
//# sourceMappingURL=voting.js.map