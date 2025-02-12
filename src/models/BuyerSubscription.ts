import mongoose, { Schema, Document } from "mongoose";

export interface IBuyerSubscription extends Document {
  name: string;
  price: number;
  duration: number;
  features: string[];
  tier: number;
  carBiddingLimit: number; // Number of cars the buyer can bid on
}

const BuyerSubscriptionSchema: Schema<IBuyerSubscription> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },
    features: {
      type: [String],
      required: [true, "Features are required"],
    },
    tier: {
      type: Number,
      required: [true, "Tier is required"],
    },
    carBiddingLimit: {
      type: Number,
      required: [true, "Car bidding limit is required"],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const BuyerSubscription = mongoose.model<IBuyerSubscription>(
  "BuyerSubscription",
  BuyerSubscriptionSchema
);
export default BuyerSubscription;
