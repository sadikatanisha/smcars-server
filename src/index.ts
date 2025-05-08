import express, { Express, Request, Response } from "express";
import http from "http";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import connectDB from "./config/db";
import userRoutes from "./routes/user.route";
import sellerRoutes from "./routes/seller.route";
import buyerRoutes from "./routes/buyer.route";
import subscriptionRoute from "./routes/subscription.route";
import adminRoute from "./routes/admin.route";
import { startCronJobs } from "./config/cronJob";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";

app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: [clientUrl],
    credentials: true,
  })
);

connectDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome!");
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/admin", adminRoute);

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

startCronJobs(io);

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
