"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const editorController_1 = require("../controllers/editorController");
const router = (0, express_1.Router)();
router.post("/mergeAudioVideo", editorController_1.handleMergeAudioVideo);
exports.default = router;
