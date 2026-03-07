import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../client/prismaClient";
import { logger } from "../lib/logger";

const JWT_EXPIRY = "7d";

function signToken(payload: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "All parameters are required" });
      return;
    }

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    if (user.authProvider === "google" || user.authProvider === "github") {
      res.status(400).json({ success: false, message: "Please sign in with your OAuth provider" });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password as string);
    if (!isPasswordCorrect) {
      res.status(401).json({ success: false, message: "Invalid password" });
      return;
    }

    const accessToken = signToken({ id: user.id, email: user.email });
    user.password = null;

    res.json({ success: true, user, accessToken });
  } catch (error) {
    logger.error(error, "login error");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

enum AuthProvider {
  CREDENTIALS = "credentials",
  GOOGLE = "google",
  GITHUB = "github",
}

export const handleSignUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, authProvider, id: providerGeneratedId } = req.body;

    if (!name || !email || !authProvider) {
      res.status(400).json({ success: false, message: "All parameters are required" });
      return;
    }

    // OAuth providers: upsert user and return an access token
    if (authProvider === "google" || authProvider === "github") {
      let user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: providerGeneratedId,
            name,
            email,
            authProvider: authProvider === "google" ? AuthProvider.GOOGLE : AuthProvider.GITHUB,
          },
        });
      }
      const accessToken = signToken({ id: user.id, email: user.email });
      user.password = null;
      res.json({ success: true, user, accessToken });
      return;
    }

    // Credentials signup: just create the user, no token (user signs in separately)
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        authProvider: AuthProvider.CREDENTIALS,
      },
    });

    user.password = null;
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error, "signup error");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
