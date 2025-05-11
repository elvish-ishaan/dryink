"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promController_1 = require("../controllers/promController");
const router = (0, express_1.Router)();
router.post("/", promController_1.handlePrompt);
exports.default = router;
