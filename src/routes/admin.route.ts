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
  createAuctionAdmin,
  deleteCar,
  getAdminCarDetails,
  getAllCars,
  getAllUsers,
  getApprovedCars,
  getBannedUsers,
  getCarAuctionDetails,
  getCarAuctionHistory,
  getSingleUserDetails,
  messages,
  rejectCar,
  verifyUser,
} from "../controllers/admin.controller";
const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post("/create-sub", createSubscription);
router.put("/update-sub/:type/:id", updateSubscription);
router.delete("/delete-sub/:type/:id", deleteSubscription);

// Auction
router.post("/create-auction", createAuctionAdmin);

// user related
router.get("/all-users", getAllUsers);
router.get("/user-details/:userId", getSingleUserDetails);
router.get("/banned-users", getBannedUsers);
router.patch("/verify-user/:userId", verifyUser);
router.patch("/ban-user/:userId", banUser);
router.delete("/delete-car", deleteCar);

router.get("/messages", messages);

//car related
router.get("/allCars", getAllCars);
router.get("/get-approved-cars", getApprovedCars);
router.get("/listing/:id", getAdminCarDetails);
router.get("/car-auction-details/:carId", getCarAuctionDetails);
router.get("/car-auction-history/:carId", getCarAuctionHistory);
router.patch("/approve-car/:carId", approveCar);
router.patch("/reject-car/:carId", rejectCar);
export default router;
