import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import promptRoute from './routes/prompt'
import editorRoute from './routes/editor'
import authRoute from './routes/auth'
import sessionRoute from './routes/session'

dotenv.config();

const app = express();

app.use(express.json())
app.use(cors())

//all base routes
app.use('/api/v1/prompt', promptRoute)
app.use('/api/v1/editor', editorRoute)
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/sessions', sessionRoute)

app.get("/", (req, res) => {
 res.json({
  success: true,
  message: 'server is running'
 })
});

app.listen( process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});