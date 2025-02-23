import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
} from "../controllers/subscription.controller";
import {
  approveCar,
  getAdminCarDetails,
  getAllCars,
  rejectCar,
} from "../controllers/admin.controller";
const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post("/create-sub", createSubscription);
router.put("/update-sub/:type/:id", updateSubscription);
router.delete("/delete-sub/:type/:id", deleteSubscription);
//car related
router.get("/allCars", getAllCars);
router.get("/listing/:id", getAdminCarDetails);
router.patch("/approve-car/:carId", approveCar);
router.patch("/reject-car/:carId", rejectCar);
export default router;
