import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      lowercase: true,
    },
    profile: {
      type: String,
      default: "",
    },
    number: {
      type: String, // changed to string for better compatibility (leading zeros, formatting)
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    loyalty_points: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationcode: {
      type: String,
      default: "",
    },
    forgetpasswordotp: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    type: {
      type: String,
      enum: ["normal", "stock"],
      default: "normal",
    },
    bussinesname: {
      type: String,
      default: "",
    },
    bussinesaddress: {
      type: String,
      default: "",
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "ShoppingItem",
      },
    ],
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    orderhistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate access token method
userSchema.methods.generateaccesstoken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
