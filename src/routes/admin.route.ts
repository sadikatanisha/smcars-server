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
  banUser,
  getAdminCarDetails,
  getAllCars,
  getAllUsers,
  getSingleUserDetails,
  rejectCar,
  verifyUser,
} from "../controllers/admin.controller";
const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post("/create-sub", createSubscription);
router.put("/update-sub/:type/:id", updateSubscription);
router.delete("/delete-sub/:type/:id", deleteSubscription);
// user related
router.get("/all-users", getAllUsers);
router.get("/user-details/:userId", getSingleUserDetails);
router.patch("/verify-user/:userId", verifyUser);
router.patch("/ban-user/:userId", banUser);
//car related
router.get("/allCars", getAllCars);
router.get("/listing/:id", getAdminCarDetails);
router.patch("/approve-car/:carId", approveCar);
router.patch("/reject-car/:carId", rejectCar);
export default router;
