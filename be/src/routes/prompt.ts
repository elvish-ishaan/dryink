import { Router } from "express";
import { handlePrompt } from "../controllers/promController";

const router = Router();

router.post("/", handlePrompt);

export default router;