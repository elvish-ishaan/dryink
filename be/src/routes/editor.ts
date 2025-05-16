import { Router } from "express";
import { handleMergeAudioVideo } from "../controllers/editorController";

const router = Router();

router.post("/mergeAudioVideo", handleMergeAudioVideo);

export default router;