import { Router } from "express";
import {
  updateUserProfile,
  submitVerification,
  sendMessage,
  createUserInDb,
  getToken,
  getMyData,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/create-user", createUserInDb);
router.post("/get-token", getToken);
router.post("/send-message", sendMessage);
router.get("/me", authMiddleware, getMyData);
router.put("/update-profile", authMiddleware, updateUserProfile);
router.patch("/submit-verification", authMiddleware, submitVerification);

export default router;
