import { Router } from "express";

import {
  checkBiddingLimit,
  getAllAuctionCars,
  getAuctionById,
  getBiddedCars,
  getSingleCarDetails,
  placeBid,
} from "../controllers/buyer.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/auction-cars", getAllAuctionCars);
router.get("/auction-cars/:carId", getSingleCarDetails);
router.get("/auction/:auctionId", getAuctionById);

router.get("/check-bid-limit/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const limitData = await checkBiddingLimit(userId);
    res.status(200).json(limitData);
  } catch (error) {
    next(error);
  }
});

router.patch("/place-bid/:carId", authMiddleware, placeBid);
router.get("/bidded-cars", authMiddleware, getBiddedCars);
export default router;
