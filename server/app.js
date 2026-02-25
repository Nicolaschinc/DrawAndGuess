import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import setupRoutes from "./routes.js";
import registerSocketHandlers from "./registerHandlers.js";

dotenv.config();

const app = express();
app.use(cors());

setupRoutes(app);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;

export { server, PORT };
