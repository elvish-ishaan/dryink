import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../client/prismaClient";


export const handleLogin = async (req: Request, res: Response) => {
  try {
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

    //check weather user already registered via google or github
    if(user.authProvider === 'google' || user.authProvider === 'github'){
      res.status(400).json({
        success: false,
        message: 'User already registered',
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
    const { name, email, password, authProvider, id: providerGeneratedId } = req.body;

    if (!name || !email || !authProvider) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    //check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    //return positive response for auth provier= google or github
    if(existingUser && authProvider === 'google' || authProvider === 'github'){
      res.status(200).json({
        success: true,
        message: 'User already exists',
      });
      return
    }
    //reutrn this for credentials auth provider
    if(existingUser){
      res.status(400).json({
        success: false,
        message: 'User already exists',
      });
      return
    }

    console.log('creating new usre............')
    //if user doesnt exist, create new one 
   let user;
   if(authProvider === 'google'){
       user = await prisma.user.create({
        data: {
          id: providerGeneratedId,
          name,
          email,
          authProvider: AuthProvider.GOOGLE
        },
      });
   }
    
    //if github
    if(authProvider === 'github'){
      user = await prisma.user.create({
        data: {
          id:providerGeneratedId,
          name,
          email,
          authProvider: AuthProvider.GITHUB
        },
      });
    }
    //if credentials
    // in this case password is must and should be hashed before saving
    if(authProvider === 'credentials'){
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 10),
          authProvider: AuthProvider.CREDENTIALS
        },
      });
    }

    //check if user created
    if(!user){
      res.status(400).json({
        success: false,
        message: 'Unable to create user',
      });
      return
    }

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