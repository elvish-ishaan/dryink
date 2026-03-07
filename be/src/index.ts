import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

import promptRoute from './routes/prompt';
import editorRoute from './routes/editor';
import authRoute from './routes/auth';
import sessionRoute from './routes/session';
import paymentRoute from './routes/payment';
import contactRoute from './routes/contact';

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many requests' });
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many signup attempts' });

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup', signupLimiter);

app.use('/api/v1/prompt', promptRoute);
app.use('/api/v1/editor', editorRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/sessions', sessionRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/contact', contactRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: 'server is running'
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
