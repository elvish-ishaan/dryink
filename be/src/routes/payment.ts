import { Router } from 'express';
import { createOrder, verifyPayment, getCredits } from '../controllers/paymentController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/create-order', isAuthenticated, createOrder);
router.post('/verify',       isAuthenticated, verifyPayment);
router.get('/credits',       isAuthenticated, getCredits);

export default router;
