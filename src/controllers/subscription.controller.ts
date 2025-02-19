import { Request, Response, NextFunction, RequestHandler } from "express";
import SellerSubscription, {
  ISellerSubscription,
} from "../models/SellerSubscription";
import BuyerSubscription, {
  IBuyerSubscription,
} from "../models/BuyerSubscription";
import User from "../models/User";

// @desc    Get subscriptions based on user role
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
// @route   GET /api/subscriptions//my-subscription
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

// @desc    Get All subscription plan
// @route   GET /api/subscriptions/
// @access  Private

export const getAllSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buyerSubscriptions: IBuyerSubscription[] =
      await BuyerSubscription.find();
    const sellerSubscriptions: ISellerSubscription[] =
      await SellerSubscription.find();
    res.status(200).json({
      buyerSubscriptions,
      sellerSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get All subscription plan
// @route   POST /api/admin/create-sub
// @access  Public ( Admin )

export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, ...subscriptionData } = req.body;
    let newSubscription;
    if (type === "buyer") {
      newSubscription = await BuyerSubscription.create(subscriptionData);
    } else if (type === "seller") {
      newSubscription = await SellerSubscription.create(subscriptionData);
    } else {
      res.status(400).json({ message: "Invalid subscription type" });
      return;
    }
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get All subscription plan
// @route   POST /api/admin/update-sub/:type/:id
// @access  Put ( Admin )

export const updateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, id } = req.params;
    const updateData = req.body;
    let updatedSubscription;
    if (type === "buyer") {
      updatedSubscription = await BuyerSubscription.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    } else if (type === "seller") {
      updatedSubscription = await SellerSubscription.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    } else {
      res.status(400).json({ message: "Invalid subscription type" });
      return;
    }
    if (!updatedSubscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }
    res.status(200).json(updatedSubscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get All subscription plan
// @route   DELETE /api/admin/delete-sub/:type/:id
// @access  Delete ( Admin )

export const deleteSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, id } = req.params;
    let deletedSubscription;
    if (type === "buyer") {
      deletedSubscription = await BuyerSubscription.findByIdAndDelete(id);
    } else if (type === "seller") {
      deletedSubscription = await SellerSubscription.findByIdAndDelete(id);
    } else {
      res.status(400).json({ message: "Invalid subscription type" });
      return;
    }
    if (!deletedSubscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }
    res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
