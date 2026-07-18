import { Router } from 'express';
import { handleContact } from '../controllers/contactController';

const router = Router();

router.post('/', handleContact);

export default router;
