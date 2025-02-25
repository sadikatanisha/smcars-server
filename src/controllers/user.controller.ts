import { Request, Response, NextFunction, RequestHandler } from "express";
import User from "../models/User";
import { auth as firebaseAuth } from "../firebase";
import BuyerSubscription from "../models/BuyerSubscription";
import SellerSubscription from "../models/SellerSubscription";
import bcrypt from "bcrypt";
import { getAuth } from "firebase-admin/auth";

// @desc    Signup user
// @route   POST /api/users/signup
// @access  Public

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password, name, contact, picture, role } = req.body;

  try {
    // Check if all parameters have been provided
    if (!email || !password || !name || !contact) {
      res.status(400).json({ message: "All fields are mandatory" });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res
        .status(400)
        .json({ message: "The provided email is already registered" });
      return;
    }

    // Assign default subscription plan
    let defaultSubscription = null;
    if (role === "buyer") {
      defaultSubscription = await BuyerSubscription.findOne({
        price: 0,
        tier: 1,
      });
    } else if (role === "seller") {
      defaultSubscription = await SellerSubscription.findOne({
        price: 0,
        tier: 1,
      });
    }
    if (!defaultSubscription) {
      res.status(500).json({
        message: `Default free subscription for role ${role} not found.`,
      });
      return;
    }

    // Create user in Firebase

    let firebaseUser;
    try {
      firebaseUser = await firebaseAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (error) {
      console.error("Firebase error during user creation:", error);
      res.status(500).json({ message: "Error creating user in Firebase." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in MongoDB
    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
      contact,
      picture: picture || undefined,
      subscription: defaultSubscription._id,
      role: role || "buyer",
      uid: firebaseUser.uid,
    });

    const idToken = await firebaseAuth.createCustomToken(firebaseUser.uid);

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: {
        email: newUser.email,
        name: newUser.name,
        _id: newUser._id,
        role: newUser.role,
        subscription: newUser.subscription,
      },
      token: idToken,
    });
  } catch (error) {
    console.log("An error occurred creating the user", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are mandatory" });
      return;
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "Provided email is not registered" });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Generate Firebase ID token
    let firebaseUser;
    try {
      firebaseUser = await firebaseAuth.getUserByEmail(email);
    } catch (error) {
      console.error("Firebase user not found:", error);
      res.status(500).json({ message: "User authentication error" });
      return;
    }

    // Generate Firebase custom token
    // const idToken = await firebaseAuth.createCustomToken(firebaseUser.uid);
    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid);

    // Return user information and Firebase ID token
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name || firebaseUser.displayName,
        uid: firebaseUser.uid,
        role: user.role,
        subscription: user.subscription,
      },
      token: customToken,
    });
  } catch (error) {
    console.error("An error occurred during login:", error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify ID Token (Not a custom token)
    const decodedToken = await getAuth().verifyIdToken(token);

    if (!decodedToken) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    // Revoke refresh tokens to prevent re-authentication
    await getAuth().revokeRefreshTokens(decodedToken.uid);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

// @desc    Get user
// @route   POST /api/users/:uid
// @access  Private

export const getUser: RequestHandler<{ uid: string }> = async (
  req,
  res,
  next
) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserInfo: RequestHandler<{ uid: string }> = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).populate(
      "subscription"
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
    return;
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update-profile
// @access  Private

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
