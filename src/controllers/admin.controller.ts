import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";
import User from "../models/User";
import Auction from "../models/Auction";
import mongoose from "mongoose";

// @desc    Get All Users
// @route   GET /api/admin/allUsers
// @access  Private (Admin)
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().select("name email role accountStatus");
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get Single User Details
// @route   GET /api/admin/user-details/:userId
// @access  Private (Admin)
export const getSingleUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId; // Use userId as defined in the route
    const user = await User.findById(userId)
      .populate("carsListed carsBidded subscription")
      .exec();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details for admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Verify User
// @route   PATCH /api/admin/verify-user/:userId
// @access  Private (Admin)
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update account status to "verified"
    user.accountStatus = "verified";
    await user.save();

    res.status(200).json({ message: "User verified successfully", user });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Ban User
// @route   PATCH /api/admin/ban-user/:userId
// @access  Private (Admin)
export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update account status to "banned"
    user.accountStatus = "banned";
    await user.save();

    res.status(200).json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

// @desc    Delete Car
// @route   DELETE /api/admin/delete-car
// @access  Private (Admin)

export const deleteCar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { carId } = req.body;
    console.log("Received carId:", carId);

    // Validate carId is provided and is a valid ObjectId
    if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
      res.status(400).json({ message: "Invalid car id" });
      return;
    }

    // Find the car to ensure it exists
    const car = await Car.findById(carId);
    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }
    console.log(car);
    // Delete the car
    await Car.findByIdAndDelete(carId);

    // Remove this car from the seller's 'carsListed' array
    await User.findByIdAndUpdate(car.sellerId, {
      $pull: { carsListed: car._id },
    });

    // Optionally, delete all auctions associated with this car if needed
    await Auction.deleteMany({ car: car._id });

    res
      .status(200)
      .json({ message: "Car and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting car:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get banned users
// @route   GET /api/admin/banned-users/
// @access  Private (Admin)

export const getBannedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bannedUsers = await User.find({ accountStatus: "banned" }).select(
      "name email role accountStatus contact"
    );

    res.status(200).json({ bannedUsers });
  } catch (error) {
    console.error("Error fetching banned users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create Auction for Car
// @route   POST /api/admin/create-auction
// @access  Private

export const createAuctionAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Admin check (assuming req.user is populated via middleware)
    // if (!req.user || !req.user.isAdmin) {
    //   res.status(403).json({ message: "Access denied. Admins only." });
    //   return;
    // }

    const { car, seller, startTime, endTime, reservePrice } = req.body;

    // Validate required fields
    if (!car || !seller || !startTime || !endTime || !reservePrice) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res
        .status(400)
        .json({ message: "Invalid date format for startTime or endTime" });
      return;
    }
    if (start >= end) {
      res.status(400).json({ message: "startTime must be before endTime" });
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

    // Verify the car exists, is approved for auction, and belongs to the provided seller
    const carData = await Car.findById(car);
    if (!carData) {
      res.status(404).json({ message: "Car not found" });
      return;
    }
    if (carData.status !== "approved") {
      res.status(400).json({ message: "Car is not approved for auction" });
      return;
    }
    // Optional: Validate that the seller provided matches the car's owner
    if (carData.sellerId.toString() !== seller) {
      res
        .status(400)
        .json({ message: "The seller does not match the car owner" });
      return;
    }

    // Create and save the new auction
    const auction = new Auction({
      car,
      seller,
      startTime: start,
      endTime: end,
      reservePrice,
      status: "scheduled",
    });
    const savedAuction = await auction.save();

    // Update car data to track the auction
    const savedCar = await Car.findByIdAndUpdate(
      car,
      {
        $inc: { auctionCount: 1 },
        $set: { auctionStatus: "in_auction", currentAuction: savedAuction._id },
      },
      { new: true }
    );
    console.log("saved car", savedCar);
    res.status(201).json(savedAuction);
  } catch (error: unknown) {
    console.error("Error during auction creation:", error);
    res
      .status(500)
      .json({ success: false, message: "An unknown error occurred" });
  }
};
// @desc    Create Auction for Car
// @route   GET /api/admin/approved-cars
// @access  Private

export const getApprovedCars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const approvedCars = await Car.find({ status: "approved" })
      .select("carName price status sellerId auctionStatus")
      .slice("images", 1)
      .populate("sellerId", "name email")
      .exec();
    console.log(approvedCars);
    res.status(200).json({ approvedCars });
  } catch (error) {
    console.error("Error fetching banned users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
