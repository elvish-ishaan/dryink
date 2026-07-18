declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        name?: string;
        iat?: number;
        exp?: number;
      }
    }
  }
}

export {};
