import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { Order } from "../models/orders.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import { sendemailverification } from "../middelwares/Email.js";
import path from "path";
import fs from "fs";

const generateaccestoken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accesstoken = await user.generateaccesstoken();
    return { accesstoken };
  } catch (error) {
    throw new apierror(500, "Error generating token");
  }
};

const registeruser = asynchandler(async (req, res) => {
  console.log("Register route hit");
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

  // Validate input fields
  if (!email || !password || !fullname || !number) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(
            "Profile image deleted after validation failure:",
            imagePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Error deleting profile image after validation failure:",
          deleteError
        );
      }
    }
    throw new apierror(400, "All fields are required");
  }

  // Check for existing email
  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(
            "Profile image deleted after email exists check:",
            imagePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Error deleting profile image after email exists check:",
          deleteError
        );
      }
    }
    throw new apierror(
      400,
      existedEmail.verified
        ? "Email already exists, please proceed to login"
        : "Email exists but is unverified, please verify your account"
    );
  }

  // Generate OTP
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  try {
    // Create user with verified: false
    const user = await User.create({
      profile: profile ? profile.filename : "",
      email,
      password,
      fullname,
      number: parseInt(number),
      type,
      bussinesname,
      bussinesaddress,
      verified: false,
      verificationcode: verificationCode,
    });

    // Send OTP email
    await sendemailverification(user.email, user.verificationcode);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration",
      email: user.email,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(
            "Profile image deleted after failed registration:",
            imagePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Error deleting profile image after failed registration:",
          deleteError
        );
      }
    }
    throw new apierror(500, `Error during registration: ${error.message}`);
  }
});

const verifyotp = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  // Validate input
  if (!email || !otp) {
    throw new apierror(400, "Email and OTP are required");
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  // Check if already verified
  if (user.verified) {
    throw new apierror(400, "User is already verified");
  }

  // Verify OTP
  if (user.verificationcode !== otp) {
    throw new apierror(400, "Invalid OTP");
  }

  try {
    // Update user to verified
    user.verified = true;
    user.verificationcode = undefined; // Clear OTP
    await user.save();

    // Generate access token
    const { accesstoken } = await generateaccestoken(user._id);

    // Set cookie options
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    // Get user data without password
    const verifiedUser = await User.findById(user._id).select("-password");

    return res.status(200).cookie("accesstoken", accesstoken, options).json({
      success: true,
      message: "User verified successfully",
      user: verifiedUser,
      token: accesstoken,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new apierror(500, `Error verifying OTP: ${error.message}`);
  }
});

const resendotp = asynchandler(async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    throw new apierror(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.verified) {
    throw new apierror(400, "User is already verified");
  }

  // Generate new OTP
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.verificationcode = verificationCode;
  await user.save();

  // Send new OTP
  await sendemailverification(user.email, user.verificationcode);

  return res.json({
    success: true,
    message: "New OTP sent to your email",
    otp: user.verificationcode, // For testing; remove in production
  });
});

const forgotpassword = asynchandler(async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    throw new apierror(400, "Email is required");
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  // Check if user is verified
  if (!user.verified) {
    throw new apierror(
      400,
      "Please verify your account before resetting password"
    );
  }

  // Generate OTP
  const forgetPasswordOtp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.forgetpasswordotp = forgetPasswordOtp;
  await user.save();

  // Send OTP email
  try {
    await sendemailverification(
      user.email,
      user.forgetpasswordotp,
      "Reset Your Fair Mart Password"
    );
    return res.json({
      success: true,
      message: "Password reset OTP sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Error sending password reset OTP:", error);
    throw new apierror(
      500,
      `Error sending password reset OTP: ${error.message}`
    );
  }
});

const resetpassword = asynchandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Validate input
  if (!email || !otp || !newPassword) {
    throw new apierror(400, "Email, OTP, and new password are required");
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  // Check if user is verified
  if (!user.verified) {
    throw new apierror(
      400,
      "Please verify your account before resetting password"
    );
  }

  // Verify OTP
  if (user.forgetpasswordotp !== otp) {
    throw new apierror(400, "Invalid OTP");
  }

  try {
    // Update password
    user.password = newPassword;
    user.forgetpasswordotp = undefined; // Clear OTP
    await user.save();

    // Get user without password
    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new apierror(500, `Error resetting password: ${error.message}`);
  }
});

const delunverifiedusers = asynchandler(async (req, res) => {
  const users = await User.find({ verified: false });
  let deletedCount = 0;

  for (const user of users) {
    // Delete profile image if exists
    if (user.profile) {
      const imagePath = path.join(process.cwd(), "public", user.profile);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Profile image deleted for unverified user:", imagePath);
        }
      } catch (deleteError) {
        console.error(
          "Error deleting profile image for unverified user:",
          deleteError
        );
      }
    }
    await User.findByIdAndDelete(user._id);
    deletedCount++;
  }

  return res.json({
    success: true,
    message: `Deleted ${deletedCount} unverified users`,
  });
});

const login = asynchandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: !email ? "Email is required" : "Password is required",
    });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User does not exist",
    });
  }

  // Check if user is verified
  if (!user.verified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your account before logging in",
    });
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Password is not valid",
    });
  }

  // Generate access token
  const { accesstoken } = await generateaccestoken(user._id);

  // Set cookie options
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // Get user data without password
  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .json({
      success: true,
      message: "Login successful",
      data: {
        user: loggedInUser,
        token: accesstoken,
      },
    });
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

  // Determine which user ID to use
  let userId = id || req.user.id;

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Check if user is verified
  if (!user.verified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your account before updating profile",
    });
  }

  // Handle profile image update
  if (profile) {
    if (user.profile) {
      const oldImagePath = path.join(process.cwd(), "public", user.profile);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Old profile image deleted successfully:", oldImagePath);
        }
      } catch (error) {
        console.error("Error deleting old profile image:", error);
      }
    }
    user.profile = profile.filename;
  }

  // Update user fields if provided
  if (fullname) user.fullname = fullname;
  if (email) user.email = email;
  if (number) user.number = parseInt(number);
  if (type) user.type = type;
  if (bussinesname) user.bussinesname = bussinesname;
  if (bussinesaddress) user.bussinesaddress = bussinesaddress;

  // Check if any fields were updated
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
    return res.status(200).json({
      success: true,
      message: "No changes provided",
      user,
    });
  }

  try {
    if (password) {
      console.log("Updating password for user:", userId);
      user.password = password;
    }

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
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(
            "New profile image deleted after failed update:",
            imagePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Error deleting new profile image after failed update:",
          deleteError
        );
      }
    }
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
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
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.profile) {
    const imagePath = path.join(process.cwd(), "public", user.profile);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Profile image deleted successfully:", imagePath);
      }
    } catch (error) {
      console.error("Error deleting profile image:", error);
    }
  }

  const deleteduser = await User.findByIdAndDelete(id);
  if (deleteduser) {
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user: deleteduser,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

const logout = asynchandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  res.clearCookie("accesstoken", options);
  res.json({ message: "Logged out successfully" });
});

const addloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  user.loyalty_points += points;
  await user.save();
  res.json({ message: "Loyalty points added successfully", user });
});

const redeemloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.loyalty_points < points) {
    throw new apierror(400, "Insufficient loyalty points");
  }

  user.loyalty_points -= points;
  await user.save();
  res.json({ message: "Loyalty points redeemed successfully", user });
});

const addtofavourites = asynchandler(async (req, res) => {
  const { productid } = req.body;
  const product = await ShoppingItem.findById(productid);
  if (!product) {
    throw new apierror(404, "Product not found");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (!user.favorites.includes(productid)) {
    user.favorites.push(productid);
    await user.save();
  }

  res.json({ message: "Product added to favourites", user });
});

const removefromfavourites = asynchandler(async (req, res) => {
  const { productid } = req.body;
  const product = await ShoppingItem.findById(productid);
  if (!product) {
    throw new apierror(404, "Product not found");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  user.favorites = user.favorites.filter((id) => id.toString() !== productid);
  await user.save();
  res.json({ message: "Product removed from favorites", user });
});

const getfavourites = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  const favorites = await ShoppingItem.find({ _id: { $in: user.favorites } });
  res.json({ favorites });
});

const addtoorderhistory = asynchandler(async (req, res) => {
  const { orderid } = req.body;
  const order = await Order.findById(orderid);
  if (!order) {
    throw new apierror(404, "Order not found");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (!user.orderhistory.includes(orderid)) {
    user.orderhistory.push(orderid);
    await user.save();
  }

  res.json({ message: "Order added to order history", user });
});

const getorderhistory = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  const orderhistory = await Order.find({
    _id: { $in: user.orderhistory },
  }).populate("products.product");
  res.json({ orderhistory });
});

export {
  registeruser,
  verifyotp,
  resendotp,
  forgotpassword,
  resetpassword,
  delunverifiedusers,
  login,
  logout,
  updateprofile,
  getallusers,
  deleteuser,
  addloyaltypoints,
  redeemloyaltypoints,
  addtofavourites,
  removefromfavourites,
  getfavourites,
  addtoorderhistory,
  getorderhistory,
};
