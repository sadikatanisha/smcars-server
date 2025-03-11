import cron from "node-cron";
import Auction, { IAuction } from "../models/Auction";
import Car, { ICar } from "../models/Car";

cron.schedule("* * * * *", async () => {
  console.log("🔄 Cron job running...");

  try {
    const now = new Date();

    // Activate scheduled auctions that should become active
    const auctionsToActivate = await Auction.find({
      status: "scheduled",
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    console.log(`⏳ Auctions to activate: ${auctionsToActivate.length}`);

    for (const auction of auctionsToActivate) {
      console.log(`🔹 Activating auction ${auction._id}`);
      await Auction.updateOne(
        { _id: auction._id },
        { $set: { status: "active" } }
      );
    }

    // Find all scheduled/active auctions that should have ended
    const auctionsToEnd: IAuction[] = await Auction.find({
      status: { $in: ["scheduled", "active"] },
      endTime: { $lte: now },
    });

    console.log(`⏳ Auctions to end: ${auctionsToEnd.length}`);

    for (const auction of auctionsToEnd) {
      console.log(`🔹 Ending auction ${auction._id} (was: ${auction.status})`);

      // Update auction status to "ended"
      await Auction.updateOne(
        { _id: auction._id },
        { $set: { status: "ended" } }
      );

      // Find the associated car
      const car: ICar | null = await Car.findOne({
        currentAuction: auction._id,
      });

      if (car) {
        console.log(`🚗 Found car ${car._id} linked to auction ${auction._id}`);

        if (auction.bids.length > 0) {
          // If bids exist, consider it sold
          console.log(
            `🏆 Auction ${auction._id} had bids, marking car as sold.`
          );
          car.auctionStatus = "sold";
        } else {
          // If no bids, reset to no auction
          console.log(`❌ Auction ${auction._id} had no bids, resetting car.`);
          car.auctionStatus = "none";
          car.currentAuction = undefined;
        }

        await car.save();
        console.log(
          `✅ Car ${car._id} updated: auctionStatus=${car.auctionStatus}`
        );
      }
    }

    console.log("✅ Auction update process completed.");
  } catch (error) {
    console.error("❌ Error updating auction statuses:", error);
  }
});
