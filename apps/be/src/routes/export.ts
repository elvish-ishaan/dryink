import { Router } from "express";
import { handleExportRequest, handleExportProgress } from "../controllers/exportController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.post("/", isAuthenticated, handleExportRequest);
router.get("/:jobId/progress", handleExportProgress); // auth handled inline via ?token= query param

export default router;
