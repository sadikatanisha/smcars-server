import { Request, Response, NextFunction } from "express";
import Auction, { IAuction } from "../models/Auction";
import Car, { ICar } from "../models/Car";
import BuyerSubscription from "../models/BuyerSubscription";
import User, { IUser } from "../models/User";
import mongoose from "mongoose";
import { Types } from "mongoose";

export const getActiveAuctionCars = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch auctions that are currently active
    const auctions = await Auction.find({ status: "active" }).populate("car");
    res.status(200).json({ success: true, auctions });
  } catch (error: any) {
    console.error("Error fetching active auction cars:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAuctionCars = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all auctions regardless of their status
    const auctions = await Auction.find().populate("car");

    res.status(200).json({ success: true, auctions });
  } catch (error: any) {
    console.error("Error fetching all auction cars:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSingleCarDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { carId } = req.params;

  try {
    // Find the car by ID
    const car = await Car.findById(carId).populate("sellerId", "name email");

    if (!car) {
      res.status(404).json({ success: false, message: "Car not found" });
      return;
    }

    // Find the active auction for this car (if any)
    const auction = await Auction.findOne({ car: carId });

    // Prepare the response
    const response = {
      success: true,
      car: {
        _id: car._id,
        carName: car.carName,
        brand: car.brand,
        modelYear: car.modelYear,
        engine: car.engine,
        gearBox: car.gearBox,
        mileage: car.mileage,
        fuelType: car.fuelType,
        condition: car.condition,
        color: car.color,
        airConditioning: car.airConditioning,
        images: car.images,
        description: car.description,
        price: car.price,
        seller: car.sellerId,
        contactInfo: car.contactInfo,
      },
      auction: auction
        ? {
            _id: auction._id,
            startTime: auction.startTime,
            endTime: auction.endTime,
            currentBid: auction.currentBid,
            bids: auction.bids,
            status: auction.status,
          }
        : null,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Error fetching all auction cars:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkBiddingLimit = async (
  userId: string
): Promise<{ remaining: number; limit: number; used: number }> => {
  // Fetch the user and populate the subscription details
  const user = await User.findById(userId).populate("subscription");
  if (!user || user.role !== "buyer") {
    throw new Error("User not found or not a buyer");
  }

  if (!user.subscription) {
    throw new Error("No subscription assigned to the user");
  }

  // Extract the bidding limit from the subscription details
  const biddingLimit = (user.subscription as any).carBiddingLimit;
  if (biddingLimit === undefined) {
    throw new Error("Bidding limit not defined in subscription");
  }

  if (!user.subscriptionRenewalDate) {
    throw new Error("Subscription renewal date not set");
  }

  const currentCount = user.carsBidded.length;
  const remaining = biddingLimit - currentCount;

  return { remaining, limit: biddingLimit, used: currentCount };
};

// @desc    Place bid
// @route   PATCH /api/buyer/place-bid/:carId
// @access  Private (Seller)
export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auctionId, amount } = req.body;
    const userId = req.user?._id;
    const { carId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!carId) {
      res.status(400).json({ message: "Invalid car reference in auction" });
      return;
    }

    // Check if the auction is active
    const auction = await Auction.findById(auctionId);

    if (!auction || auction.status !== "active") {
      res
        .status(400)
        .json({ message: "Auction is not available for bidding." });
      return;
    }

    // Fetch user and subscription info
    const user = await User.findById(userId).populate("subscription");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const subscription = await BuyerSubscription.findById(
      user.subscription._id
    );
    const carBiddingLimit = subscription?.carBiddingLimit ?? 0;
    const uniqueBiddedCars = new Set(user.carsBidded.map((c) => c.toString()));

    // Check bidding limit: if the user hasn't bid on this car yet and has reached the limit
    if (
      !uniqueBiddedCars.has(carId) &&
      uniqueBiddedCars.size >= carBiddingLimit
    ) {
      res.status(403).json({
        message: `Bidding limit reached. Your plan allows bidding on ${carBiddingLimit} car(s).`,
      });
      return;
    }

    // Validate bid amount: It must be higher than the current bid or reserve price.
    const currentBidOrReserve = auction.currentBid || auction.reservePrice;
    if (amount <= currentBidOrReserve) {
      res.status(400).json({
        message: "Your bid must be higher than the current bid/reserve price.",
      });
      return;
    }

    console.log("Auction:", auction.bids);
    console.log("Bid Amount:", amount);
    console.log("Current Bid or Reserve:", currentBidOrReserve);

    // Record the bid
    auction.bids.push({
      bidder: new mongoose.Types.ObjectId(String(userId)) as any,
      amount,
      timestamp: new Date(),
    });
    auction.currentBid = amount;

    // If it's a new car bid, add carId to the user's bidded list
    if (!uniqueBiddedCars.has(carId)) {
      user.carsBidded.push(new mongoose.Types.ObjectId(carId) as any);
      await user.save();
    }

    // Save the updated auction
    await auction.save();

    res.status(200).json({
      message: "Bid placed successfully!",
      auction,
    });
    return;
  } catch (error) {
    console.error("Error placing bid:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
    return;
  }
};

// @desc    Get bidded cars
// @route   PATCH /api/buyer/bidded-cars
// @access  Private (Seller)

export const getBiddedCars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated." });
      return;
    }

    // Optionally, check if the user has the "seller" role (if only sellers are allowed)
    if (req.user.role !== "buyer") {
      res
        .status(403)
        .json({ message: "Access denied: Only buyers can view bidded cars." });
      return;
    }

    // Get the user by ID and populate their "carsBidded" array with car details.
    const user = await User.findById(req.user._id)
      .populate({
        path: "carsBidded",
        populate: [
          {
            path: "currentAuction",
            model: "Auction",
          },
        ],
      })
      .lean()
      .exec();
    console.log(user);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    const biddedCars = user.carsBidded.map((car: any) => ({
      _id: car._id,
      carName: car.carName,
      image: car.images[0],
      lastBid: car.currentAuction?.currentBid || 0,
      status: car.currentAuction?.status || "Unknown",
    }));

    // Return the populated bidded cars list
    res.status(200).json({ biddedCars });
  } catch (error) {
    console.error("Error fetching bidded cars:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
