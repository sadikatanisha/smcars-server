import cron from "node-cron";
import Auction from "../models/Auction";
import Car from "../models/Car";

// Schedule a job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    // Find auctions with status "scheduled" or "active" whose endTime has passed
    const auctionsToEnd = await Auction.find({
      status: { $in: ["scheduled", "active"] },
      endTime: { $lte: now },
    });

    for (const auction of auctionsToEnd) {
      auction.status = "ended";
      await auction.save();
      console.log(`Auction ${auction._id} ended at ${now.toISOString()}`);
      const car = await Car.findOne({ currentAuction: auction._id });
      if (car) {
        // Business logic: decide what auctionStatus should be.
        // For example, if the auction ended with a winning bid:
        // car.auctionStatus = "sold";
        // Otherwise, if it ended without a sale:
        car.auctionStatus = "none";
        // Optionally clear the currentAuction field
        car.currentAuction = undefined;
        await car.save();
        console.log(
          `Updated car ${car._id} auctionStatus to ${car.auctionStatus}`
        );
      }
    }
  } catch (error) {
    console.error("Error updating auction statuses:", error);
  }
});
