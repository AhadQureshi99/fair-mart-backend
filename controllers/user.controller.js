import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { Order } from "../models/orders.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to send OTP emails using hardcoded credentials (VPS env not working)
const sendOTPEmail = async (toEmail, otp, purpose = "verification") => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "24.7FairMartWeb@gmail.com",
      pass: "hnrtkosiwknrxfrf",
    },
  });

  const subject =
    purpose === "reset"
      ? "24/7 FairMart - Password Reset OTP"
      : "24/7 FairMart - Email Verification OTP";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h3 style="color:#007bff;">${subject}</h3>
      <p>Your One-Time Password (OTP) is:</p>
      <p style="font-size:24px; font-weight:bold;">${otp}</p>
      <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"24/7 FairMart" <24.7FairMartWeb@gmail.com>',
    to: toEmail,
    subject,
    html,
  });
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

  const existedUser = await User.findOne({ email });
  if (existedUser && existedUser.verified) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(401, "Email already exists, please proceed to login");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  let user;
  try {
    if (existedUser && !existedUser.verified) {
      // Update existing unverified user
      existedUser.password = password;
      existedUser.fullname = fullname;
      existedUser.number = parseInt(number);
      existedUser.type = type || existedUser.type;
      existedUser.bussinesname = bussinesname || existedUser.bussinesname;
      existedUser.bussinesaddress =
        bussinesaddress || existedUser.bussinesaddress;
      existedUser.otp = otp;
      existedUser.otpExpires = otpExpires;
      if (profile) {
        if (existedUser.profile) {
          const oldImagePath = path.join(
            process.cwd(),
            "public",
            existedUser.profile
          );
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
        existedUser.profile = profile.filename;
      }
      await existedUser.save();
      user = existedUser;
    } else {
      // Create new user
      user = await User.create({
        profile: profile ? profile.filename : undefined,
        email,
        password,
        fullname,
        number: parseInt(number),
        type,
        bussinesname,
        bussinesaddress,
        verified: false,
        otp,
        otpExpires,
      });
    }

    await sendOTPEmail(email, otp, "verification");

    const created_user = await User.findById(user._id).select(
      "-password -otp -otpExpires"
    );
    return res.status(200).json({
      message: "User registered, please verify OTP sent to your email",
      user: created_user,
    });
  } catch (error) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    throw new apierror(
      500,
      "Error creating or updating user: " + error.message
    );
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

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    throw new apierror(400, "Invalid or expired OTP");
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const { accesstoken } = await generateaccesstoken(user._id);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  const verifiedUser = await User.findById(user._id).select("-password");
  return res.status(200).cookie("accesstoken", accesstoken, options).json({
    success: true,
    message: "OTP verified successfully",
    user: verifiedUser,
    token: accesstoken,
  });
});

const resendOTP = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apierror(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.verified) {
    throw new apierror(400, "User already verified");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  await sendOTPEmail(email, otp, "verification");

  return res.status(200).json({
    success: true,
    message: "New OTP sent to your email",
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

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  await sendOTPEmail(email, otp, "reset");

  return res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email",
  });
});

const resetPassword = asynchandler(async (req, res) => {
  console.log("Reset Password Request Body:", req.body); // Debugging log
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new apierror(
      400,
      `Email, OTP, and new password are required. Received: email=${email}, otp=${otp}, newPassword=${newPassword}`
    );
  }

  const user = await User.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new apierror(400, "Invalid or expired OTP");
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

const deleteUserAccount = asynchandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.profile) {
    const imagePath = path.join(process.cwd(), "public", user.profile);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  await User.findByIdAndDelete(userId);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  res.clearCookie("accesstoken", options);

  return res.status(200).json({
    success: true,
    message: "User account deleted successfully",
  });
});

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

  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
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
    return res.status(200).json({
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
  const users = await User.find({}).select("-password -otp -otpExpires");
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

export const addloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
  user.loyalty_points += points;
  await user.save();
  res.json({ message: "Loyalty points added successfully", user });
});

export const redeemloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
  user.loyalty_points -= points;
  await user.save();
  res.json({ message: "Loyalty points redeemed successfully", user });
});

export const addtofavourites = asynchandler(async (req, res) => {
  const { productid } = req.body;
  const product = await ShoppingItem.findById(productid);
  if (!product) {
    throw new apierror(404, "Product not found");
  }
  const user = await User.findById(req.user.id);
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
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
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
  user.favorites = user.favorites.filter((id) => id.toString() !== productid);
  await user.save();
  res.json({ message: "Product removed from favorites", user });
});

export const getfavourites = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
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
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
  user.orderhistory.push(orderid);
  await user.save();
  res.json({ message: "Order added to order history", user });
});

export const getorderhistory = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.verified) {
    throw new apierror(403, "Please verify your email first");
  }
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
    throw new apierror(403, "Please verify your email first");
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

  const loggedInUser = await User.findById(user._id).select(
    "-password -otp -otpExpires"
  );
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
  delunverifiedusers,
  updateprofile,
  getallusers,
  deleteuser,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  deleteUserAccount,
};
