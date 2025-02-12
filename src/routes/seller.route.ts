import { Router } from "express";
import { createCar, getMyCars } from "../controllers/seller.controller";
import upload from "../middlewares/multer";
const router = Router();

router.post("/create-car", upload.array("images"), createCar);
router.get("/my-cars", getMyCars);

export default router;
