import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";

// @desc    Get All Cars Seller Listed
// @route   GET /api/admin/allCars
// @access  Private (Admin)

export const getAllCars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cars = await Car.find()
      .select("carName price status sellerId")
      .slice("images", 1) // Only return the first image
      .populate("sellerId", "name email")
      .exec();

    res.status(200).json({ cars });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get Single Car Details
// @route   GET /api/admin/listing/:id
// @access  Private (Admin)

export const getAdminCarDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const carId = req.params.id;
    const car = await Car.findById(carId)
      .populate("sellerId", "name email contact")
      .exec();

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    res.status(200).json({ car });
  } catch (error) {
    console.error("Error fetching car details for admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Approve Car
// @route   PATCH /api/admin/approve-car/:carId
// @access  Private (Admin)

export const approveCar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { carId } = req.params;
    const car = await Car.findByIdAndUpdate(
      carId,
      { status: "approved" },
      { new: true }
    );

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    res.json({ message: "Car approved successfully", car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reject Car
// @route   PATCH /api/admin/reject-car/:carId
// @access  Private (Admin)

export const rejectCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;
    const car = await Car.findByIdAndUpdate(
      carId,
      { status: "rejected" },
      { new: true }
    );

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    res.json({ message: "Car rejected successfully", car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ! This might cause errors

// @desc    Update Sellers Car
// @route   PATCH /api/admin/reject-car/:carId
// @access  Private (Admin)

export const updateCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;
    const updates = req.body;

    const car = await Car.findByIdAndUpdate(carId, updates, {
      new: true,
    }).exec();

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    res.json({ message: "Car updated successfully", car });
  } catch (error) {
    console.error("Error updating car:", error);
    res.status(500).json({ message: "Server error" });
  }
};
