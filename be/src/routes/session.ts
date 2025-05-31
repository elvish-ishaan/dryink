import { Router } from "express";
import { getUserSessions, getSessionById, deleteSession } from "../controllers/sessionController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Get all sessions for the authenticated user
router.get("/", isAuthenticated, getUserSessions);

// Get a specific session
router.get("/:sessionId", isAuthenticated, getSessionById);

// Delete a session
router.delete("/:sessionId", isAuthenticated, deleteSession);

export default router; 