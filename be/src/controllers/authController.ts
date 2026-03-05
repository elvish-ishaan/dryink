import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../client/prismaClient";
import { logger } from "../lib/logger";


export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.authProvider === 'google' || user.authProvider === 'github') {
      res.status(400).json({
        success: false,
        message: 'User already registered',
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user?.password as string);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
      return;
    }

    user.password = null;

    res.json({
      success: true,
      user,
    });
    return;
  } catch (error) {
    logger.error(error, 'login error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
  }
};

enum AuthProvider {
  CREDENTIALS = 'credentials',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export const handleSignUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, authProvider, id: providerGeneratedId } = req.body;

    if (!name || !email || !authProvider) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    // Fixed: operator precedence bug — was always true when authProvider === 'github'
    if (existingUser && (authProvider === 'google' || authProvider === 'github')) {
      res.status(200).json({
        success: true,
        message: 'User already exists',
      });
      return;
    }

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists',
      });
      return;
    }

    logger.info('Creating new user');
    let user;

    if (authProvider === 'google') {
      user = await prisma.user.create({
        data: {
          id: providerGeneratedId,
          name,
          email,
          authProvider: AuthProvider.GOOGLE,
        },
      });
    }

    if (authProvider === 'github') {
      user = await prisma.user.create({
        data: {
          id: providerGeneratedId,
          name,
          email,
          authProvider: AuthProvider.GITHUB,
        },
      });
    }

    if (authProvider === 'credentials') {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 10),
          authProvider: AuthProvider.CREDENTIALS,
        },
      });
    }

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Unable to create user',
      });
      return;
    }

    user.password = null;

    res.json({
      success: true,
      user,
    });
    return;
  } catch (error) {
    logger.error(error, 'signup error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
  }
};
