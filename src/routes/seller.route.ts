import { Router } from "express";
import {
  checkListingLimit,
  createAuction,
  createCar,
  editCar,
  getMyCarById,
  getMyCars,
  requestCarApproval,
} from "../controllers/seller.controller";
import upload from "../middlewares/multer";
import { authMiddleware } from "../middlewares/authMiddleware";
const router = Router();

router.use(authMiddleware);

router.post("/create-car", upload.array("images"), createCar);
router.put("/edit-car/:id", upload.array("images"), editCar);
router.get("/my-cars", getMyCars);
router.get("/my-cars/:id", getMyCarById);
router.put("/request-car-approval/:id", requestCarApproval);
router.get("/check-limit/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limitData = await checkListingLimit(userId);
    res.status(200).json(limitData);
  } catch (error) {
    next(error);
  }
});

router.post("/create-auction", createAuction);

export default router;
