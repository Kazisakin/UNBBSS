"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const admin_1 = __importDefault(require("./routes/admin"));
const errorHandler_1 = require("./middleware/errorHandler");
const nomination_1 = __importDefault(require("./routes/nomination"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const withdrawal_1 = __importDefault(require("./routes/withdrawal"));
const voting_1 = __importDefault(require("./routes/voting"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// CORS
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true, // This is crucial for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Logging
app.use((0, morgan_1.default)('combined'));
// Routes
app.use('/api/admin', admin_1.default);
app.use('/api/nomination', nomination_1.default);
app.use('/api/withdrawal', withdrawal_1.default);
app.use('/api/voting', voting_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map