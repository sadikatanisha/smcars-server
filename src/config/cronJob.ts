import cron from "node-cron";
import Auction from "../models/Auction";

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
    }
  } catch (error) {
    console.error("Error updating auction statuses:", error);
  }
});
