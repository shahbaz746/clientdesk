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

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    if (existing.role !== "developer") {
      console.error("A user with this email already exists and is not a developer.");
      process.exit(1);
    }
    console.log("Developer account already exists:", existing.email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
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
