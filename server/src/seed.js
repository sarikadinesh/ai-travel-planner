import bcrypt from "bcryptjs";
import { User } from "./models/User.js";

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@travel.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const name = process.env.ADMIN_NAME || "Platform Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    console.log(`Admin ready: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
  });
  console.log(`Admin seeded: ${email}`);
}
