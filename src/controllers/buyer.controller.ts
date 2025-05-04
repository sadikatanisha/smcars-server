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
    const auctions = await Auction.aggregate([
      // 1. Sort by startTime descending to get latest first
      { $sort: { startTime: -1 } },

      // 2. Group by car ID to get only the latest auction
      {
        $group: {
          _id: "$car",
          latestAuction: { $first: "$$ROOT" },
        },
      },

      // 3. Replace root to work with the auction document
      { $replaceRoot: { newRoot: "$latestAuction" } },

      // 4. Populate car details using lookup
      {
        $lookup: {
          from: "cars", // collection name
          localField: "car",
          foreignField: "_id",
          as: "car",
        },
      },

      // 5. Unwind the car array created by lookup
      { $unwind: "$car" },

      // 6. Optional: Filter out deleted cars
      { $match: { "car._id": { $exists: true } } },
    ]);

    res.status(200).json({
      success: true,
      count: auctions.length,
      auctions,
    });
  } catch (error: any) {
    console.error("Error fetching auction cars:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch auction cars",
    });
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

// @desc    Get winning auctions
// @route   GET /api/buyer/my-wins
// @access  Private (Buyer)
export const getMyWins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    // 1. Find all ended auctions where user has winning bids
    const winningAuctions = await Auction.aggregate([
      {
        $match: {
          status: "ended",
          "bids.bidder": userId,
        },
      },

      { $unwind: "$bids" },

      {
        $sort: {
          "bids.amount": -1,
        },
      },

      {
        $group: {
          _id: "$_id",
          auction: { $first: "$$ROOT" },
          maxBid: { $max: "$bids.amount" },
          winningBid: {
            $first: {
              $cond: [{ $eq: ["$bids.bidder", userId] }, "$bids", null],
            },
          },
        },
      },

      {
        $match: {
          "winningBid.amount": { $eq: "$maxBid" },
          "auction.reservePrice": { $lte: "$maxBid" },
        },
      },
      // Lookup car details
      {
        $lookup: {
          from: "cars",
          localField: "auction.car",
          foreignField: "_id",
          as: "car",
        },
      },
      { $unwind: "$car" },
      // Lookup seller details
      {
        $lookup: {
          from: "users",
          localField: "auction.seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      // Project final structure
      {
        $project: {
          _id: 1,
          finalPrice: "$maxBid",
          car: {
            _id: "$car._id",
            carName: "$car.carName",
            brand: "$car.brand",
            images: "$car.images",
          },
          seller: {
            _id: "$seller._id",
            name: "$seller.name",
            contact: "$seller.contact",
          },
          auctionEnd: "$auction.endTime",
          reserveMet: {
            $gte: ["$maxBid", "$auction.reservePrice"],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: winningAuctions.length,
      data: winningAuctions,
    });
  } catch (error) {
    next(error);
  }
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
// @route   GET /api/buyer/bidded-cars
// @access  Private (Seller)

interface FormattedBid {
  amount: number;
  timestamp: Date;
}

interface FormattedCar {
  _id: string;
  carName: string;
  brand: string;
  images: Array<{ url: string; public_id: string }>;
}

interface FormattedSeller {
  name: string;
  contact: string;
}

interface FormattedAuction {
  _id: string;
  car: FormattedCar;
  seller: FormattedSeller;
  startTime: Date;
  endTime: Date;
  status: string;
  currentBid?: number;
  bids: FormattedBid[];
}

export const getBiddedCars = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated." });
      return;
    }

    if (req.user.role !== "buyer") {
      res
        .status(403)
        .json({ message: "Access denied: Only buyers can view bidded cars." });
      return;
    }

    const auctions = await Auction.find({ "bids.bidder": req.user._id })
      .populate<{ car: ICar }>("car")
      .populate<{ seller: IUser }>("seller")
      .lean();

    const formattedAuctions: FormattedAuction[] = auctions.map((auction) => ({
      _id: auction._id.toString(),
      car: {
        _id: auction.car._id.toString(),
        carName: auction.car.carName,
        brand: auction.car.brand,
        images: auction.car.images,
      },
      seller: {
        name: auction.seller.name,
        contact: auction.seller.contact,
      },
      startTime: auction.startTime,
      endTime: auction.endTime,
      status: auction.status,
      currentBid: auction.currentBid,
      bids: auction.bids
        .filter((bid) => bid.bidder.toString() === req.user!._id.toString())
        .map((bid) => ({
          amount: bid.amount,
          timestamp: bid.timestamp,
        })),
    }));

    res.status(200).json({ auctionsWithBids: formattedAuctions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
