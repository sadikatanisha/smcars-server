import { Request, Response, NextFunction } from "express";
import Auction from "../models/Auction";

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
