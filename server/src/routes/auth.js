import bcrypt from "bcryptjs";
import { Router } from "express";
import { requireAuth, signToken } from "../middleware/auth.js";
import { User, toPublicUser } from "../models/User.js";

const router = Router();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (name.length < 2) {
      return res.status(400).json({ ok: false, error: "Name must be at least 2 characters." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ ok: false, error: "Enter a valid email." });
    }
    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ ok: false, error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "traveler",
    });

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Could not register." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }
    if (user.disabled) {
      return res.status(403).json({ ok: false, error: "This account is disabled." });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Could not sign in." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.publicUser });
});

export default router;
