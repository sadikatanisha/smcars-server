import { Router } from "express";
import {
  signup,
  login,
  logout,
  getUser,
  getUserInfo,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/:uid", authMiddleware, getUser);
router.get("/me/:uid", authMiddleware, getUserInfo);

export default router;
