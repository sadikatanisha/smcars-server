import { Router } from "express";
import {
  signup,
  login,
  logout,
  getUser,
  getUserInfo,
  updateUserProfile,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/:uid", authMiddleware, getUser);
router.get("/me/:uid", authMiddleware, getUserInfo);
router.put("/update-profile", authMiddleware, updateUserProfile);
router.put("/update-password", authMiddleware, updateUserProfile);

export default router;
