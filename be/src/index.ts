import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import promptRoute from './routes/prompt'
import editorRoute from './routes/editor'

dotenv.config();

const app = express();

app.use(express.json())
app.use(cors())

//all base routes
app.use('/api/v1/prompt', promptRoute)
app.use('/api/v1/editor', editorRoute)

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen( process.env.PORT, () => {
    console.log('hello')
  console.log(`Server is running on port ${process.env.PORT}`);
});