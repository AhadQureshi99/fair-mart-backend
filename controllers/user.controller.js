import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { Order } from "../models/orders.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import {
  sendemailverification,
  sendForgotPasswordEmail,
} from "../middelwares/Email.js";
import path from "path";
import fs from "fs";

const delunverifiedusers = asynchandler(async (req, res) => {
  const users = await User.deleteMany({ verified: false });
  return res.json(
    users ? { users_deleted: users } : { message: "No users to delete" }
  );
});

const generateaccesstoken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accesstoken = await user.generateaccesstoken();
    await user.save();
    return { accesstoken };
  } catch (error) {
    throw new apierror(500, "Error generating token");
  }
};

const registeruser = asynchandler(async (req, res) => {
  const {
    email,
    password,
    fullname,
    number,
    type,
    bussinesname,
    bussinesaddress,
  } = req.body;
  const profile = req.file;

  if (!email || !password || !fullname || !number) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(400, "All fields are required");
  }

  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(
      401,
      existedEmail.verified
        ? "Email already exists, please proceed to login"
        : "Email already exists, please verify your email"
    );
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  let user;
  try {
    user = await User.create({
      profile: profile ? profile.filename : undefined,
      email,
      password,
      fullname,
      number: parseInt(number),
      type,
      bussinesname,
      bussinesaddress,
      verificationcode: verificationCode,
      verified: false,
    });

    await sendemailverification(user.email, user.verificationcode);
    const created_user = await User.findById(user._id).select(
      "-password -verificationcode"
    );
    return res
      .status(200)
      .json({
        message: "Please verify your email with the OTP sent",
        user: created_user,
      });
  } catch (error) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(500, "Error creating user: " + error.message);
  }
});

const verifyOTP = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apierror(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.verified) {
    throw new apierror(400, "User already verified");
  }

  if (user.verificationcode !== otp) {
    throw new apierror(401, "Invalid OTP");
  }

  user.verified = true;
  user.verificationcode = undefined;
  await user.save();

  const { accesstoken } = await generateaccesstoken(user._id);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  const verifiedUser = await User.findById(user._id).select("-password");
  return res
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .json({
      success: true,
      message: "Email verified successfully",
      data: { user: verifiedUser, token: accesstoken },
    });
});

const forgotPassword = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apierror(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  user.forgetpasswordotp = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  await sendForgotPasswordEmail(user.email, resetToken);
  return res
    .status(200)
    .json({ message: "Password reset OTP sent to your email" });
});

const resetPassword = asynchandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new apierror(400, "Email, OTP, and new password are required");
  }

  const user = await User.findOne({
    email,
    forgetpasswordotp: otp,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new apierror(401, "Invalid or expired OTP");
  }

  user.password = newPassword;
  user.forgetpasswordotp = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json({ message: "Password reset successfully" });
});

const resendotp = asynchandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }
  if (user.verified) {
    throw new apierror(400, "User already verified");
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.verificationcode = verificationCode;
  await user.save();

  await sendemailverification(user.email, user.verificationcode);
  return res.json({ message: "New OTP sent to your email" });
});

const updateprofile = asynchandler(async (req, res) => {
  const {
    id,
    fullname,
    email,
    number,
    type,
    bussinesname,
    bussinesaddress,
    password,
  } = req.body;
  const profile = req.file;

  let userId = id || req.user.id;
  const user = await User.findById(userId);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (profile) {
    if (user.profile) {
      const oldImagePath = path.join(process.cwd(), "public", user.profile);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    user.profile = profile.filename;
  }

  if (fullname) user.fullname = fullname;
  if (email) user.email = email;
  if (number) user.number = parseInt(number);
  if (type) user.type = type;
  if (bussinesname) user.bussinesname = bussinesname;
  if (bussinesaddress) user.bussinesaddress = bussinesaddress;
  if (password) user.password = password;

  const hasUpdates =
    fullname ||
    email ||
    number ||
    type ||
    bussinesname ||
    bussinesaddress ||
    profile ||
    password;
  if (!hasUpdates) {
    return res
      .status(200)
      .json({ success: true, message: "No changes provided", user });
  }

  try {
    await user.save();
    const updatedUser = await User.findById(userId).select("-password");
    return res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
  } catch (error) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(500, "Error updating profile: " + error.message);
  }
});

const getallusers = asynchandler(async (req, res) => {
  const users = await User.find({});
  res.json({ users });
});

const deleteuser = asynchandler(async (req, res) => {
  const { id } = req.body;
  const user = await User.findById(id);

  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.profile) {
    const imagePath = path.join(process.cwd(), "public", user.profile);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  const deleteduser = await User.findByIdAndDelete(id);
  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
    user: deleteduser,
  });
});

export const logout = asynchandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  res.clearCookie("accesstoken", options);
  res.json({ message: "Logged out successfully" });
});

export const verifyuser = asynchandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.verified = true;
    user.verificationcode = undefined;
    await user.save();
    res.json({ message: "User verified successfully" });
  } else {
    throw new apierror(404, "User not found");
  }
});

export const addloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user.id);
  if (user) {
    user.loyalty_points += points;
    await user.save();
    res.json({ message: "Loyalty points added successfully", user });
  } else {
    throw new apierror(404, "User not found");
  }
});

export const redeemloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user.id);
  if (user) {
    user.loyalty_points -= points;
    await user.save();
    res.json({ message: "Loyalty points redeemed successfully", user });
  } else {
    throw new apierror(404, "User not found");
  }
});

export const addtofavourites = asynchandler(async (req, res) => {
  const { productid } = req.body;
  const product = await ShoppingItem.findById(productid);
  if (!product) {
    throw new apierror(404, "Product not found");
  }
  const user = await User.findById(req.user.id);
  user.favorites.push(productid);
  await user.save();
  res.json({ message: "Product added to favourites", user });
});

export const removefromfavourites = asynchandler(async (req, res) => {
  const { productid } = req.body;
  const product = await ShoppingItem.findById(productid);
  const user = await User.findById(req.user.id);
  if (!product) {
    throw new apierror(404, "Product not found");
  }
  user.favorites = user.favorites.filter((id) => id.toString() !== productid);
  await user.save();
  res.json({ message: "Product removed from favorites", user });
});

export const getfavourites = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const favorites = await ShoppingItem.find({ _id: { $in: user.favorites } });
  res.json({ favorites });
});

export const addtoorderhistory = asynchandler(async (req, res) => {
  const { orderid } = req.body;
  const order = await Order.findById(orderid);
  const user = await User.findById(req.user.id);
  if (!order) {
    throw new apierror(404, "Order not found");
  }
  user.orderhistory.push(orderid);
  await user.save();
  res.json({ message: "Order added to order history", user });
});

export const getorderhistory = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const orderhistory = await Order.find({
    _id: { $in: user.orderhistory },
  }).populate("products.product");
  res.json({ orderhistory });
});

const login = asynchandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apierror(
      400,
      !email ? "Email is required" : "Password is required"
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User does not exist");
  }

  if (!user.verified) {
    throw new apierror(401, "Please verify your email before logging in");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apierror(401, "Password is not valid");
  }

  const { accesstoken } = await generateaccesstoken(user._id);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  const loggedInUser = await User.findById(user._id).select("-password");
  return res
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .json({
      success: true,
      message: "Login successful",
      data: { user: loggedInUser, token: accesstoken },
    });
});

export {
  registeruser,
  login,
  resendotp,
  delunverifiedusers,
  updateprofile,
  getallusers,
  deleteuser,
  verifyOTP,
  forgotPassword,
  resetPassword,
};
