import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../client/prismaClient";


export const handleLogin = async (req: Request, res: Response) => {
  try {
    console.log('req hitted............', req.body)
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    const user = await prisma.user.findFirst({
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

    const isPasswordCorrect = await bcrypt.compare(password, user?.password as string);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
      return
    }

    //make user password null
    user.password = null;
    console.log(user,'getting user from sucess login')

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

enum AuthProvider {
  CREDENTIALS= 'credentials',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export const handleSignUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

   //hash password before saving to db
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        authProvider: AuthProvider.CREDENTIALS
      },
    });

    //make password null
    user.password = null;

    res.json({
      success: true,
      user,
    });
    return
  } catch (error) {
    console.error('signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return
  }
};  