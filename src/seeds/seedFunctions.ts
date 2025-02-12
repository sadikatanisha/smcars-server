import mongoose from "mongoose";
import BuyerSubscription from "../models/BuyerSubscription";
import SellerSubscription from "../models/SellerSubscription";

const seedBuyerSubscriptions = async () => {
  const buyerPlans = [
    {
      name: "Free",
      price: 0,
      duration: 30,
      features: ["Basic Access"],
      tier: 1,
      carBiddingLimit: 1,
    },
    {
      name: "Basic",
      price: 150,
      duration: 30,
      features: ["Basic Access"],
      tier: 2,
      carBiddingLimit: 3,
    },
    {
      name: "Premium",
      price: 350,
      duration: 30,
      features: ["Unlimited Access", "Priority Support"],
      tier: 3,
      carBiddingLimit: 5,
    },
  ];

  for (const plan of buyerPlans) {
    const exists = await BuyerSubscription.findOne({ name: plan.name });
    if (!exists) {
      await BuyerSubscription.create(plan);
      console.log(`Created ${plan.name} subscription for buyer`);
    } else {
      console.log(`${plan.name} subscription already exists for buyer`);
    }
  }
};

const seedSellerSubscriptions = async () => {
  const sellerPlans = [
    {
      name: "Free",
      price: 0,
      duration: 30,
      features: ["Basic Listing", "Seller Support"],
      tier: 1,
      carListingLimit: 1,
    },
    {
      name: "Premium",
      price: 4509,
      duration: 30,
      features: ["Unlimited Listings", "Premium Seller Support"],
      tier: 2,
      carListingLimit: 10,
    },
  ];

  for (const plan of sellerPlans) {
    const exists = await SellerSubscription.findOne({ name: plan.name });
    if (!exists) {
      await SellerSubscription.create(plan);
      console.log(`Created ${plan.name} subscription for seller`);
    } else {
      console.log(`${plan.name} subscription already exists for seller`);
    }
  }
};

export const seedDatabase = async () => {
  await seedBuyerSubscriptions();
  await seedSellerSubscriptions();
  console.log("Seeding complete.");
};

seedDatabase().catch((err) => console.error("Error during seeding:", err));
