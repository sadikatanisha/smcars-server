import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";
import cloudinary from "../config/cloudinary";
import User from "../models/User";
import mongoose from "mongoose";
import Auction from "../models/Auction";

const { Types } = mongoose;
// @desc    Create car
// @route   POST /api/seller/create-car
// @access  Public

export const createCar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
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

// @desc    Edit car details (only if not approved)
// @route   PUT /api/seller/edit-car/:id
// @access  Private (seller only)
export const editCar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    if (!sellerId) {
      res
        .status(400)
        .json({ success: false, message: "Seller ID is required" });
      return;
    }

    // Find the car by its ID
    const car = await Car.findById(id);
    if (!car) {
      res.status(404).json({ success: false, message: "Car not found" });
      return;
    }

    // Disallow edits if the car has been approved
    if (car.status === "approved") {
      res.status(400).json({
        success: false,
        message: "Car has been approved and cannot be edited",
      });
      return;
    }

    // Check that the seller owns the car
    if (car.sellerId.toString() !== sellerId.toString()) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: Car does not belong to seller",
      });
      return;
    }

    // Build an update object from the request body
    const updateFields: any = {};
    const fields = [
      "carName",
      "brand",
      "modelYear",
      "engine",
      "gearBox",
      "mileage",
      "fuelType",
      "condition",
      "color",
      "airConditioning",
      "price",
      "description",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // If new image files are uploaded, process them via Cloudinary and update images
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const imageUploads = await Promise.all(
        files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "cars",
          });
          return { url: result.secure_url, public_id: result.public_id };
        })
      );
      updateFields.images = imageUploads;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    res.status(200).json({ success: true, car: updatedCar });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error editing car:", error.message);
      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "An unknown error occurred" });
    }
  }
};

// @desc    Get cars by seller
// @route   GET /api/seller/my-cars
// @access  Private

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

// @desc    Get a single car details by ID
// @route   GET /api/seller/my-cars/:id
// @access  Private

export const getMyCarById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Car ID is required" });
      return;
    }

    // Find the car and populate seller details
    const car = await Car.findById(id).exec();

    if (!car) {
      res.status(404).json({ success: false, message: "Car not found" });
      return;
    }

    // Return the car details
    res.status(200).json({ success: true, car });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching car details:", error.message);
      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "An unknown error occurred" });
    }
  }
};

// @desc    Request car approval (change status from on_hold to pending)
// @route   PUT /api/seller/request-approval/:id
// @access  Private (seller only)

export const requestCarApproval = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    if (!sellerId) {
      res
        .status(400)
        .json({ success: false, message: "Seller ID is required" });
      return;
    }

    // Find the car by its ID
    const car = await Car.findById(id);
    if (!car) {
      res.status(404).json({ success: false, message: "Car not found" });
      return;
    }

    // Check that the seller owns the car
    if (car.sellerId.toString() !== sellerId.toString()) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: Car does not belong to seller",
      });
      return;
    }

    // Ensure the car is in the 'on_hold' state before allowing the status change
    if (car.status !== "on_hold") {
      res.status(400).json({
        success: false,
        message:
          "Car is not in 'on_hold' state and cannot be sent for approval",
      });
      return;
    }

    // Update the car status to 'pending'
    car.status = "pending";
    const updatedCar = await car.save();

    res.status(200).json({ success: true, car: updatedCar });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error requesting car approval:", error.message);
      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "An unknown error occurred" });
    }
  }
};

// @desc    Get car listing limit by seller
// Helper function

export const checkListingLimit = async (
  userId: string
): Promise<{ remaining: number; limit: number; used: number }> => {
  // Fetch the user and populate the subscription details
  const user = await User.findById(userId).populate("subscription");
  if (!user || user.role !== "seller") {
    throw new Error("User not found or not a seller");
  }

  if (!user.subscription) {
    throw new Error("No subscription assigned to the user");
  }

  // Extract the listing limit from the subscription details
  const listingLimit = (user.subscription as any).carListingLimit;
  if (listingLimit === undefined) {
    throw new Error("Listing limit not defined in subscription");
  }

  if (!user.subscriptionRenewalDate) {
    throw new Error("Subscription renewal date not set");
  }

  // Count how many cars were listed since the subscriptionRenewalDate
  const currentCount = await Car.countDocuments({
    sellerId: user._id,
    createdAt: { $gte: user.subscriptionRenewalDate },
  });

  const remaining = listingLimit - currentCount;

  return { remaining, limit: listingLimit, used: currentCount };
};

// @desc    Create Auction for Car
// @route   POST /api/seller/create-auction
// @access  Private

export const createAuction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { car, seller, startTime, endTime, reservePrice } = req.body;

    // Validate required fields
    if (!car || !seller || !startTime || !endTime || !reservePrice) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if there's an existing auction for this car that is scheduled or active
    const existingAuction = await Auction.findOne({
      car,
      seller,
      status: { $in: ["scheduled", "active"] },
    });

    if (existingAuction) {
      res
        .status(400)
        .json({ message: "An auction already exists for this car" });
      return;
    }

    // Verify the car exists, belongs to the seller, and is approved for auction
    const carData = await Car.findById(car);
    if (!carData) {
      res.status(404).json({ message: "Car not found" });
      return;
    }
    if (carData.sellerId.toString() !== seller) {
      res
        .status(403)
        .json({ message: "Unauthorized: Car does not belong to seller" });
      return;
    }
    if (carData.status !== "approved") {
      res.status(400).json({ message: "Car is not approved for auction" });
      return;
    }

    // Create and save the new auction
    const auction = new Auction({
      car,
      seller,
      startTime,
      endTime,
      reservePrice,
      status: "scheduled",
    });
    const savedAuction = await auction.save();

    // update car data to tract auction
    await Car.findByIdAndUpdate(car, {
      $inc: { auctionCount: 1 },
      auctionStatus: "in_auction",
      currentAuction: auction._id,
    });
    console.log(car);
    res.status(201).json(savedAuction);
  } catch (error: unknown) {
    res
      .status(500)
      .json({ success: false, message: "An unknown error occurred" });
  }
};
