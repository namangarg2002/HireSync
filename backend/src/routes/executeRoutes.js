import express from 'express';
import { codeEditorExecution } from '../controllers/executeController.js';

const router = express.Router();

router.post("/", codeEditorExecution)

export default router;