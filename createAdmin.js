import * as dotenv from "dotenv";
dotenv.config();
import { connectdb } from "./db/dbconnection.js";
import { User } from "./models/user.model.js";

const createSuperAdmin = async () => {
  try {
    await connectdb();

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: "superadmin@gmail.com" });

    if (existingAdmin) {
      console.log("Superadmin already exists");
      process.exit(0);
    }

    // Create new superadmin
    const superAdmin = await User.create({
      email: "superadmin@gmail.com",
      password: "123456",
      fullname: "Super Admin",
      number: 1234567890,
      role: "superadmin",
      type: "normal",
      verified: true, // Set as verified by default
    });

    console.log("Superadmin created successfully:", superAdmin);
    process.exit(0);
  } catch (error) {
    console.error("Error creating superadmin:", error);
    process.exit(1);
  }
};

createSuperAdmin();
