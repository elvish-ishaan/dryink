"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const prompt_1 = __importDefault(require("./routes/prompt"));
const editor_1 = __importDefault(require("./routes/editor"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
//all base routes
app.use('/api/v1/prompt', prompt_1.default);
app.use('/api/v1/editor', editor_1.default);
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.listen(process.env.PORT, () => {
    console.log('hello');
    console.log(`Server is running on port ${process.env.PORT}`);
});
