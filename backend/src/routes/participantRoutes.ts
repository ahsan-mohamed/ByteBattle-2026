import { Router } from "express";
import {
  startParticipant,
  startQuiz,
  getQuizQuestions,
  getQuizStatus,
  saveProgress,
  submitQuiz,
  recordViolation,
} from "../controllers/participantController";

const router = Router();

router.post("/participants/start", startParticipant);

router.post("/quiz/start", startQuiz);
router.get("/quiz/questions", getQuizQuestions);
router.get("/quiz/status", getQuizStatus);
router.post("/quiz/save-progress", saveProgress);
router.post("/quiz/submit", submitQuiz);
router.post("/quiz/violation", recordViolation);

export default router;
