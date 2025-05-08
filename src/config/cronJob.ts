// src/config/cronJob.ts
import cron from "node-cron";
import mongoose from "mongoose";
import Auction from "../models/Auction";
import Car from "../models/Car";
import { Server as SocketIOServer } from "socket.io";

/**
 * Start scheduled auction status updates.
 * @param io Socket.IO server instance
 */

export function startCronJobs(io: SocketIOServer) {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log(`Cron running at ${now.toISOString()}`);

    const { modifiedCount } = await Auction.updateMany(
      { status: "scheduled", startTime: { $lte: now } },
      { $set: { status: "active" } }
    );
    if (modifiedCount > 0) {
      console.log(`Activated ${modifiedCount} auctions`);
      io.emit("auctionStarted");
    }

    const ending = await Auction.find({
      status: "active",
      endTime: { $lte: now },
    });
    console.log(`Auctions to end: ${ending.length}`);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const auc of ending) {
          await Auction.updateOne(
            { _id: auc._id, status: "active" },
            { $set: { status: "ended" } },
            { session }
          );

          const carUpdate =
            (auc.currentBid ?? 0) >= auc.reservePrice
              ? { auctionStatus: "sold", currentAuction: null }
              : { auctionStatus: "none", currentAuction: null };

          await Car.updateOne({ _id: auc.car }, carUpdate, { session });

          io.emit("auctionEnded", { auctionId: auc._id });
        }
      });
      console.log("Auction status update transaction complete");
    } catch (err) {
      console.error("Transaction failed", err);
    } finally {
      session.endSession();
    }
  });
}
