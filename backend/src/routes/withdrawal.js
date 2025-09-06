"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const withdrawalController_1 = require("../controllers/withdrawalController");
const router = express_1.default.Router();
router.post('/request-otp', withdrawalController_1.requestWithdrawalOtp);
router.post('/verify-otp', withdrawalController_1.verifyWithdrawalOtp);
router.get('/details', withdrawalController_1.getNominationDetails);
router.post('/submit', withdrawalController_1.submitWithdrawal);
exports.default = router;
//# sourceMappingURL=withdrawal.js.map