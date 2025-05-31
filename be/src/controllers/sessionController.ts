import { Request, Response } from "express";
import { prisma } from "../client/prismaClient";

// Get all sessions for a user
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        chats: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('getUserSessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
};

// Get a specific session with its chats
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id
      },
      include: {
        chats: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('getSessionById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session'
    });
  }
};

// Delete a session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // First check if session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Delete all chats in the session first
    await prisma.chat.deleteMany({
      where: {
        chatSessionId: sessionId
      }
    });

    // Then delete the session
    await prisma.chatSession.delete({
      where: {
        id: sessionId
      }
    });

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('deleteSession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
}; 