import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
const router = Router();

router.use(authMiddleware, adminMiddleware);

export default router;
