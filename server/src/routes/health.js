import { Router } from "express";
import { getDbStatus } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const db = getDbStatus();
  const ok = db === "connected";
  res.status(ok ? 200 : 503).json({
    ok,
    service: "ai-travel-planner-api",
    db,
    time: new Date().toISOString(),
  });
});

export default router;
