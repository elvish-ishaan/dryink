import express from "express";
import { handleLogin, handleSignUp } from "../controllers/authController";
const router = express.Router();

router.post("/login", handleLogin  )
router.post("/signup", handleSignUp  )

export default router;