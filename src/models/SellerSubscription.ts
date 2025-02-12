import mongoose, { Schema, Document } from "mongoose";

export interface ISellerSubscription extends Document {
  name: string;
  price: number;
  duration: number;
  features: string[];
  tier: number;
  carListingLimit: number;
}

const SellerSubscriptionSchema: Schema<ISellerSubscription> = new Schema(
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
    carListingLimit: {
      type: Number,
      required: [true, "Car listing limit is required"],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SellerSubscription = mongoose.model<ISellerSubscription>(
  "SellerSubscription",
  SellerSubscriptionSchema
);
export default SellerSubscription;
