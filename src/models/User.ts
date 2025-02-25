import mongoose, { Schema, Document } from "mongoose";

// Interface for User Document
export interface IUser extends Document {
  uid: string;
  name: string;
  email: string;
  password: string;
  picture: string;
  role: string;
  contact: string;
  subscription: mongoose.Types.ObjectId;
  subscriptionRenewalDate?: Date;
  carsListed: mongoose.Types.ObjectId[];
  carsBidded: mongoose.Types.ObjectId[];

  presentAddress: string;
  permanentAddress: string;
  city: string;

  // status
  accountStatus: "pending" | "requested" | "verified" | "banned";
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    uid: {
      type: String,
      required: [true, "Firebase ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    picture: {
      type: String,
      default: "https://example.com/default-profile.png",
      trim: true,
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^\+?\d{7,15}$/, "Please provide a valid contact number"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: function () {
        return this.role === "buyer"
          ? "BuyerSubscription"
          : "SellerSubscription";
      },
      default: null,
    },
    // Field to track when the subscription was renewed
    subscriptionRenewalDate: {
      type: Date,
      default: Date.now,
    },
    carsListed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],
    carsBidded: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],
    presentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "requsted", "verified", "banned"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
