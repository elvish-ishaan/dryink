import { Request, Response } from 'express';
import { logger } from '../lib/logger';

// POST /api/v1/contact
export const handleContact = async (req: Request, res: Response) => {
  try {
    const { name, email, company, message } = req.body as {
      name: string;
      email: string;
      company: string;
      message: string;
    };

    if (!name || !email || !company || !message) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    logger.info({ name, email, company }, 'Enterprise contact inquiry received');

    // TODO: wire up email notification (e.g. Resend / SendGrid) using CONTACT_EMAIL env var
    res.json({ success: true, message: 'Your message has been received. We will get back to you within 24 hours.' });
  } catch (error) {
    logger.error(error, 'handleContact error');
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
