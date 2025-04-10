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
    await Promise.all(
      auctionsToActivate.map(async (auction) => {
        await Auction.updateOne(
          { _id: auction._id },
          { $set: { status: "active" } }
        );
      })
    );

    // Find ending auctions
    const endingAuctions: IAuction[] = await Auction.find({
      status: { $in: ["scheduled", "active"] },
      endTime: { $lte: now },
    });

    console.log(`⏳ Processing ${endingAuctions.length} ending auctions`);

    await Promise.all(
      endingAuctions.map(async (auction) => {
        // Update auction status first
        await Auction.updateOne(
          { _id: auction._id },
          { $set: { status: "ended" } }
        );

        // Find associated car
        const car: ICar | null = await Car.findOne({
          currentAuction: auction._id,
        });

        if (!car) {
          console.log(`🚨 No car found for auction ${auction._id}`);
          return;
        }

        // Check if reserve price was met
        const maxBid =
          auction.bids.length > 0
            ? Math.max(...auction.bids.map((b) => b.amount))
            : 0;

        const reserveMet = maxBid >= auction.reservePrice;

        if (reserveMet) {
          console.log(
            `🏆 Auction ${auction._id} met reserve (${maxBid}/${auction.reservePrice})`
          );
          car.auctionStatus = "sold";
          car.currentAuction = undefined;
        } else {
          console.log(
            `❌ Reserve not met for ${auction._id} (${maxBid}/${auction.reservePrice})`
          );
          car.auctionStatus = "none";
          car.currentAuction = undefined;
        }

        await car.save();
      })
    );

    console.log("✅ Auction update process completed.");
  } catch (error) {
    console.error("❌ Error updating auction statuses:", error);
  }
});
