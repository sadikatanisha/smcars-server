import mongoose, { Schema, Document } from "mongoose";

// Interface for Car Document
export interface ICar extends Document {
  carName: string;
  brand: string;
  modelYear: string;
  engine: string;
  gearBox: string;
  mileage: string;
  fuelType: string;
  condition: string;
  color: string;
  airConditioning: boolean;
  images: {
    url: string;
    public_id: string;
  }[];
  description: string;
  price: number;
  sellerId: mongoose.Schema.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  //
  auctionStatus?: "none" | "in_auction" | "sold";
  currentAuction?: mongoose.Schema.Types.ObjectId;
  auctionCount: number; // Tracks how many auctions this car has been in

  createdAt: Date;
  updatedAt: Date;
}

// Car Schema
const CarSchema: Schema<ICar> = new Schema(
  {
    carName: {
      type: String,
      required: [true, "Car name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
    },
    modelYear: {
      type: String,
      required: [true, "Model year type is required"],
    },
    engine: {
      type: String,
      required: [true, "Engine type is required"],
    },
    gearBox: {
      type: String,
      required: [true, "Gearbox type is required"],
    },
    mileage: {
      type: String,
      required: [true, "Mileage is required"],
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      required: [true, "Fuel type is required"],
    },
    condition: {
      type: String,
      enum: ["New", "Used", "Excellent"],
      required: [true, "Condition is required"],
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    airConditioning: {
      type: Boolean,
      default: false,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    description: String,
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // to tract auction
    auctionStatus: {
      type: String,
      enum: ["none", "in_auction", "sold"],
      default: "none",
    },
    currentAuction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
    },
    auctionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Car = mongoose.model<ICar>("Car", CarSchema);
export default Car;
