import { Router } from "express";
import { handleFollowUpPrompt, handlePrompt } from "../controllers/promController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.post("/", isAuthenticated, handlePrompt);
router.post('/followUpPrompt',isAuthenticated, handleFollowUpPrompt);

export default router;