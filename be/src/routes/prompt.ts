import { Router } from "express";
import { handleFollowUpPrompt, handlePrompt } from "../controllers/promController";

const router = Router();

router.post("/", handlePrompt);
router.post('/followUpPrompt', handleFollowUpPrompt);

export default router;