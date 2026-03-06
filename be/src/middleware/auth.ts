import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { logger } from "../lib/logger";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  const tokenParts = token.split(" ");

  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  try {
    console.log('[AUTH DEBUG] JWT_SECRET defined:', !!process.env.JWT_SECRET);
    console.log('[AUTH DEBUG] Token (first 20 chars):', tokenParts[1]?.substring(0, 20));
    const decodedToken = jwt.verify(tokenParts[1], process.env.JWT_SECRET!);
    req.user = decodedToken as Request['user'];
    next();
  } catch (error) {
    console.error('[AUTH DEBUG] Verify error:', error);
    logger.error(error, 'Token verification failed');
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }
};
