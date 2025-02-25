import { Request, Response, NextFunction } from "express";
import Car from "../models/Car";
import User from "../models/User";

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
