import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { seedAdmin } from "./seed.js";
import authRouter from "./routes/auth.js";
import healthRouter from "./routes/health.js";
import tripsRouter from "./routes/trips.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = Number(process.env.PORT) || 5050;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_travel_planner";

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  // #region agent log
  fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
    body: JSON.stringify({
      sessionId: "2092fc",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "server/src/index.js:request",
      message: "api_request_hit",
      data: { method: req.method, url: req.originalUrl },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  next();
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/trips", tripsRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

async function start() {
  try {
    await connectDb(MONGO_URI);
    console.log("MongoDB connected");
    await seedAdmin();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
  server.timeout = 120000;
}

start();
