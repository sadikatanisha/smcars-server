import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";

export const getAllCars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cars = await Car.find().populate("sellerId", "name email").exec();

    res.status(200).json({ cars });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

// Approve Car
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

// Reject Car
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
