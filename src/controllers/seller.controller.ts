import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";
import cloudinary from "../config/cloudinary";
import User from "../models/User";
import mongoose from "mongoose";

// @desc    Create car
// @route   POST /api/seller/create-car
// @access  Public

export const createCar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession(); // Start a session for transactions
  session.startTransaction();

  try {
    const {
      carName,
      brand,
      modelYear,
      engine,
      gearBox,
      mileage,
      fuelType,
      condition,
      color,
      airConditioning,
      price,
      description,
      sellerId,
    } = req.body;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new Error("No files uploaded");
    }
    // Upload images to Cloudinary
    const imageUploads = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cars",
        });
        return { url: result.secure_url, public_id: result.public_id };
      })
    );

    // Save car details in the database
    const car = new Car({
      carName,
      brand,
      modelYear,
      engine,
      gearBox,
      mileage,
      fuelType,
      condition,
      color,
      airConditioning,
      price,
      description,
      sellerId,
      images: imageUploads,
    });

    const savedCar = await car.save({ session });
    // Add the car to the seller's carsListed array
    const seller = await User.findByIdAndUpdate(
      sellerId,
      { $push: { carsListed: savedCar._id } }, // Add the car's ID to the seller's carsListed array
      { new: true, session }
    );
    if (!seller) {
      throw new Error("Seller not found");
    }

    await session.commitTransaction(); // Commit the transaction

    res.status(201).json({ success: true, car: savedCar });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating car:", error.message);
      res.status(500).json({
        success: false,
        message: `Failed to create car listing: ${error.message}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "An unknown error occurred while creating the car listing.",
      });
    }
  }
};

// @desc    Get cars by seller
// @route   GET /api/seller/my-cars
// @access  Public

export const getMyCars = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      res
        .status(400)
        .json({ success: false, message: "Seller ID is required" });
      return;
    }

    // Find the seller by their ID
    const seller = await User.findById(sellerId).populate("carsListed");

    if (!seller) {
      res.status(404).json({ success: false, message: "Seller not found" });
      return;
    }

    // Return the populated cars
    res.status(200).json({ success: true, cars: seller.carsListed });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching seller cars:", error.message);
      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "An unknown error occurred" });
    }
  }
};
