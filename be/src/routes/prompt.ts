import { Router } from "express";
import {  handleJobStatus, handlePrompt } from "../controllers/promController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.post("/", isAuthenticated, handlePrompt);
// router.post('/followUpPrompt',isAuthenticated, handleFollowUpPrompt);
router.get("/:jobId", isAuthenticated, handleJobStatus);

export default router;