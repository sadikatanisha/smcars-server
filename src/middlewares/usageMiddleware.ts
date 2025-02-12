import { Request,Response,NextFunction } from "express";
import User from "../models/User";
import SellerSubscription from "../models/SellerSubscription";

export const checkListingLimit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await User.findById(req.user?._id).populate('subscription');
    //   if (user?.role === 'seller') {
    //     const subscription = user.subscription as ISellerSubscription;
    //     if (user.sellerUsage?.listingsCreated >= subscription.carListingLimit) {
    //       return res.status(403).json({
    //         message: 'Listing limit exceeded. Please upgrade your subscription.'
    //       });
    //     }
    //   }
      next();
    } catch (error) {
      next(error);
    }
  };