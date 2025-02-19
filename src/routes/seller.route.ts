import { Router } from "express";
import {
  checkListingLimit,
  createAuction,
  createCar,
  getMyCars,
} from "../controllers/seller.controller";
import upload from "../middlewares/multer";
const router = Router();

router.post("/create-car", upload.array("images"), createCar);
router.get("/my-cars", getMyCars);
router.get("/check-limit/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limitData = await checkListingLimit(userId);
    res.status(200).json(limitData);
  } catch (error) {
    next(error);
  }
});

// Auction
router.post("/create-auction", createAuction);

export default router;
