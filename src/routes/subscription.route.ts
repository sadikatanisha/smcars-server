import { Router } from "express";
import {
  getAllSubscriptions,
  getAvailableSubscriptions,
  getUserSubscription,
} from "../controllers/subscription.controller";

const router = Router();

router.get("/available", getAvailableSubscriptions);
router.get("/my-subscription", getUserSubscription);
router.get("/", getAllSubscriptions);

export default router;
