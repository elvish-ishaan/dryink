import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../client/prismaClient';
import { logger } from '../lib/logger';

const PACKAGES = {
  starter: { credits: 40,  amountUSD: 20, amountCents: 2000 },
  pro:     { credits: 80,  amountUSD: 40, amountCents: 4000 },
  power:   { credits: 170, amountUSD: 80, amountCents: 8000 },
} as const;

type PackageId = keyof typeof PACKAGES;

function getRazorpayInstance() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// POST /api/v1/payment/create-order
export const createOrder = async (req: Request, res: Response) => {
  const { packageId } = req.body as { packageId: PackageId };
  const pkg = PACKAGES[packageId];

  if (!pkg) {
    res.status(400).json({ success: false, message: 'Invalid package' });
    return;
  }

  try {
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount:   pkg.amountCents,
      currency: 'USD',
      receipt:  `r_${req.user?.id?.slice(0, 8)}_${Date.now().toString(36)}`,
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId:          req.user?.id,
        razorpayOrderId: razorpayOrder.id,
        credits:         pkg.credits,
        amountUSD:       pkg.amountUSD,
        status:          'created',
      },
    });

    res.json({
      success: true,
      data: {
        orderId:       razorpayOrder.id,
        amount:        razorpayOrder.amount,
        currency:      razorpayOrder.currency,
        packageId,
        credits:       pkg.credits,
        transactionId: transaction.id,
      },
    });
  } catch (error) {
    logger.error(error, 'createOrder error');
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// POST /api/v1/payment/verify
export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ success: false, message: 'Missing payment details' });
    return;
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400).json({ success: false, message: 'Payment verification failed' });
    return;
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    if (transaction.status === 'paid') {
      res.json({ success: true, message: 'Payment already processed', credits: transaction.credits });
      return;
    }

    await prisma.$transaction([
      prisma.transaction.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'paid',
        },
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: { credits: { increment: transaction.credits } },
      }),
    ]);

    res.json({ success: true, message: 'Payment verified and credits added', credits: transaction.credits });
  } catch (error) {
    logger.error(error, 'verifyPayment error');
    res.status(500).json({ success: false, message: 'Internal server error during verification' });
  }
};

// GET /api/v1/payment/credits
export const getCredits = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { credits: true },
    });
    res.json({ success: true, credits: user?.credits ?? 0 });
  } catch (error) {
    logger.error(error, 'getCredits error');
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
