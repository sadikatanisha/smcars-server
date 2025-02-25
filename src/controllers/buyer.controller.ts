import { Request, Response, NextFunction } from "express";
import Auction from "../models/Auction";
import Car from "../models/Car";

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
