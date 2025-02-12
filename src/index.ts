import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import bodyParser from "body-parser";
import cors from "cors";

import connectDB from "./config/db";
import userRoutes from "./routes/user.route";
import sellerRoutes from "./routes/seller.route";
import subscriptionRoute from "./routes/subscription.route";
import adminRoute from "./routes/admin.route";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:5173"], // frontend origin
    credentials: true,
  })
);

connectDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome!");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/admin", adminRoute);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
