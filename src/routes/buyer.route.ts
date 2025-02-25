import { Router } from "express";

import {
  getAllAuctionCars,
  getSingleCarDetails,
} from "../controllers/buyer.controller";

const router = Router();

router.get("/auction-cars", getAllAuctionCars);
router.get("/auction-cars/:carId", getSingleCarDetails);

export default router;
