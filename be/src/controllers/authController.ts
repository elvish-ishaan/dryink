import { Request, Response } from "express";
import { prisma } from "../generated/prisma";
import bcrypt from "bcrypt";


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
      return
    }

    //make user password null
    user.password = null;

    //return responce
    res.json({
      success: true,
      user,
    });
    return
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return
  }
};  