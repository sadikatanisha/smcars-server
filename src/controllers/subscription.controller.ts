import { Request, Response, NextFunction, RequestHandler } from "express";
import SellerSubscription from "../models/SellerSubscription";
import BuyerSubscription from "../models/BuyerSubscription";
import User from "../models/User";

// @desc    Get user
// @route   GET /api/subscriptions/available
// @access  Private
export const getAvailableSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.query;
    if (role === "seller") {
      const subscriptions = await SellerSubscription.find();
      res.json(subscriptions);
      return;
    } else if (role === "buyer") {
      const subscriptions = await BuyerSubscription.find();
      res.json(subscriptions);
      return;
    } else {
      res.status(400).json({ message: "Invalid role" });
      return;
    }
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

// @desc    Get user subscription plan
// @route   POST /api/subscriptions/
// @access  Private

export const getUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid } = req.query;

    // First, find the user without population to check the role
    const user = await User.findOne({ uid }).select(
      "name email role subscription"
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.subscription) {
      res.status(404).json({ message: "No active subscription found" });
      return;
    }

    const modelName =
      user.role === "buyer" ? "BuyerSubscription" : "SellerSubscription";

    // Re-fetch the user and populate the subscription field with the explicit model name
    const populatedUser = await User.findById(user._id).populate({
      path: "subscription",
      model: modelName,
    });

    if (!populatedUser) {
      res.status(404).json({ message: "User not found after re-fetch" });
      return;
    }

    res.status(200).json(populatedUser.subscription);
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
