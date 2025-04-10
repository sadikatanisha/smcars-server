import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

// Interface for Auction Document
export interface IAuction extends Document {
  car: mongoose.Schema.Types.ObjectId;
  seller: mongoose.Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  reservePrice: number;
  currentBid?: number;
  bids: {
    bidder: mongoose.Types.ObjectId | IUser;
    amount: number;
    timestamp: Date;
  }[];
  status: "scheduled" | "active" | "ended" | "relisted";
}

// Auction Schema
const AuctionSchema: Schema<IAuction> = new Schema(
  {
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    reservePrice: {
      type: Number,
      required: true,
    },
    currentBid: Number,
    bids: [
      {
        bidder: { type: Schema.Types.ObjectId, ref: "User" },
        amount: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "active", "ended", "relisted"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

const Auction = mongoose.model<IAuction>("Auction", AuctionSchema);
export default Auction;
