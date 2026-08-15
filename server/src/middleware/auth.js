import jwt from "jsonwebtoken";
import { User, toPublicUser } from "../models/User.js";

function getSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    getSecret(),
    { expiresIn: "7d" }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: "Sign in required." });
  }

  try {
    const payload = jwt.verify(token, getSecret());
    const user = await User.findById(payload.sub);
    if (!user || user.disabled) {
      return res.status(401).json({ ok: false, error: "Account is not available." });
    }
    req.user = user;
    req.publicUser = toPublicUser(user);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired session." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin only." });
  }
  next();
}
