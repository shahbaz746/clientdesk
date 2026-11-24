require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

async function seedDeveloper() {
  const email = process.env.DEVELOPER_EMAIL;
  const password = process.env.DEVELOPER_PASSWORD;
  const name = process.env.DEVELOPER_NAME || "Developer";

  if (!email || !password) {
    console.error(
      "Set DEVELOPER_EMAIL and DEVELOPER_PASSWORD in server/.env before seeding."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("DEVELOPER_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    console.error("DEVELOPER_PASSWORD cannot exceed 72 UTF-8 bytes.");
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (existing.role !== "developer") {
      console.error("A user with this email already exists and is not a developer.");
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: existing._id },
      {
        $set: { name, passwordHash },
        $inc: { tokenVersion: 1 },
      }
    );
    console.log("Developer credentials updated.");
    process.exit(0);
  }

  const developerExists = await User.exists({ role: "developer" });
  if (developerExists) {
    console.error("A global developer account already exists.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "developer",
  });

  console.log("Developer account created:", user.email);
  process.exit(0);
}

seedDeveloper().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
