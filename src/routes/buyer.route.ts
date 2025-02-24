import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware";
import { getAllAuctionCars } from "../controllers/buyer.controller";

const router = Router();

router.get("/auction-cars", getAllAuctionCars);

export default router;
