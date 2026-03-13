import express from 'express';
// import protectRoute from '../middlewares/protectRoute.js';
import { codeEditorExecution } from '../controllers/executeController.js';

const router = express.Router();

router.post("/", codeEditorExecution)

export default router;