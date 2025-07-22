import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      lowercase: true,
    },
    profile: {
      type: String,
    },
    number: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
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
    },
    forgetpasswordotp: {
      type: String,
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
  {
    timestamps: true,
    capped: { max: 1000000, size: 10485760 }, // Optional: limit collection size
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

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
