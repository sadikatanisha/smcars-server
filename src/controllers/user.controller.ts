import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcrypt";
import Leads from "../models/Leads";
import jwt from "jsonwebtoken";

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, contact, presentAddress, permanentAddress, city } = req.body;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Update basic fields
    user.contact = contact || user.contact;
    user.presentAddress = presentAddress || user.presentAddress;
    user.permanentAddress = permanentAddress || user.permanentAddress;
    user.city = city || user.city;

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        presentAddress: user.presentAddress,
        permanentAddress: user.permanentAddress,
        city: user.city,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc    Update user password
// @route   PUT /api/users/update-password
// @access  Private

export const updateUserPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
        return;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });
    }
  } catch (error) {
    console.error("Error updating user password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// submit account verification by adding address and contact information
export const submitVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Extract the updated fields from the request body.
    const { phone, address } = req.body;
    if (!phone || !address) {
      res.status(400).json({ message: "Phone and address are required" });
      return;
    }

    // Update the user's contact and presentAddress fields and change accountStatus
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        contact: phone,
        presentAddress: address,
        accountStatus: "pending",
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Verification submitted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error submitting verification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update user password
// @route   PUT /api/users/send-message
// @access  Public

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, contactNo, message } = req.body;

    // Validate required fields
    if (!name || !contactNo) {
      res.status(400).json({
        success: false,
        message: "Name and contact number are required.",
      });
      return;
    }

    // Create a new lead
    const lead = await Leads.create({
      name,
      email,
      contactNo,
      message,
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: "Your message has been sent successfully.",
    });
  } catch (error: any) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Create MongoDB user record after Firebase signup
 * @route   POST /api/users/create-user
 * @access  PUBLIC
 */

export const createUserInDb = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, name, contact, picture, role } = req.body;
    console.log("role", role);
    if (!email || !name || !contact || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    let user = await User.findOne({ email });

    if (user) {
      res.status(200).json({ message: "User already exists", user });
      return;
    }

    user = await User.create({
      email,
      name,
      contact,
      picture: picture || undefined,
      role,
    });

    await user.populate("subscription");
    res.status(201).json({
      message: "User created successfully",
      user,
    });
    return;
  } catch (err) {
    console.error("createUserInDb error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  * @route /api/users/get-token
//    controllers/auth.controller.ts (or wherever your getToken lives)

export const getToken = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  // ⚠️ NO MORE UPSERT! ⚠️
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found – please sign up first",
    });
    return;
  }

  const payload = { email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });

  res.status(200).json({
    success: true,
    message: "Token generated successfully",
    data: { token },
  });
};

export const getMyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user as IUser | undefined;
    if (!me) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const fresh = await User.findById(me._id)
      .select("-password -__v")
      .populate("subscription")
      .lean();

    if (!fresh) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: fresh,
    });
  } catch (err: any) {
    console.error("Error in getMyData:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
