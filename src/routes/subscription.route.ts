import { Router } from "express";
import {
  getAvailableSubscriptions,
  getUserSubscription,
} from "../controllers/subscription.controller";

const router = Router();

router.get("/available", getAvailableSubscriptions);
router.get("/my-subscription", getUserSubscription);

export default router;
