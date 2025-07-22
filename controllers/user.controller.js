import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { Order } from "../models/orders.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import path from "path";
import fs from "fs";
import { sendemailverification } from "../middelwares/Email.js";

const delunverifiedusers = asynchandler(async (req, res) => {
  const users = await User.deleteMany({ verified: false });
  if (users) {
    return res.json({ users_deleted: users });
  } else {
    return res.json({ message: "no users to delete" });
  }
});

const generateaccestoken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accesstoken = await user.generateaccesstoken();
    await user.save();
    return { accesstoken };
  } catch (error) {
    throw new apierror(500, "Error generating token");
  }
};

let registeruser = asynchandler(async (req, res) => {
  console.log("Register route hit");
  console.log("req.file:", req.file);
  console.log("req.body:", req.body);
  const {
    email,
    password,
    fullname,
    number,
    type,
    bussinesname,
    bussinesaddress,
    role,
  } = req.body;
  const profile = req.file;

  // Validate input fields
  if (!email || !password || !fullname || !number) {
    // Cleanup uploaded file if validation fails
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
    // Cleanup uploaded file if email exists
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
    if (!existedEmail.verified) {
      return res
        .status(401)
        .json({ message: "Email already exists and user is not verified" });
    } else {
      return res
        .status(401)
        .json({ message: "Email already exists, please proceed to login" });
    }
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  let user;
  try {
    // Create the user with verification code but not verified
    user = await User.create({
      profile: profile ? profile.filename : "",
      email,
      password,
      fullname,
      number: parseInt(number),
      type: type || "normal",
      bussinesname: bussinesname || "",
      bussinesaddress: bussinesaddress || "",
      verified: false,
      verificationcode: verificationCode,
      role: role || "user",
    });

    await sendemailverification(user.email, user.verificationcode);

    return res.status(200).json({
      message: "Please verify your email with the OTP sent",
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        number: user.number,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    // Cleanup uploaded file if user creation fails
    if (profile) {
      const imagePath = path.join(process.cwd(), "public", profile.filename);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(
            "Profile image deleted after failed user creation:",
            imagePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Error deleting profile image after failed user creation:",
          deleteError
        );
      }
    }
    throw new apierror(500, "Error creating user", error.message);
  }
});

const verifyotp = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apierror(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.verified) {
    return res.status(400).json({ message: "User already verified" });
  }

  if (user.verificationcode !== otp) {
    throw new apierror(400, "Invalid OTP");
  }

  user.verified = true;
  user.verificationcode = undefined;
  await user.save();

  const { accesstoken } = await generateaccestoken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const verifiedUser = await User.findById(user._id).select("-password");

  return res.status(200).cookie("accesstoken", accesstoken, options).json({
    success: true,
    message: "User verified successfully",
    user: verifiedUser,
    token: accesstoken,
  });
});

const forgotpassword = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apierror(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.forgetpasswordotp = resetCode;
  await user.save();

  await sendemailverification(user.email, resetCode);

  return res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email",
  });
});

const resetpassword = asynchandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new apierror(400, "Email, OTP, and new password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }

  if (user.forgetpasswordotp !== otp) {
    throw new apierror(400, "Invalid OTP");
  }

  user.password = newPassword;
  user.forgetpasswordotp = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

const resendotp = asynchandler(async (req, res) => {
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

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.verificationcode = verificationCode;
  await user.save();

  await sendemailverification(user.email, user.verificationcode);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully to your email",
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
  let userId;

  // If an ID is provided in the request body and the current user is an admin, use that ID
  if (id) {
    userId = id;
  } else {
    // Otherwise, use the ID of the currently logged-in user
    userId = req.user.id;
  }

  // Find the user first
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Handle profile image update if a new image is provided
  if (profile) {
    // Delete the old image if it exists
    if (user.profile) {
      const oldImagePath = path.join(process.cwd(), "public", user.profile);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Old profile image deleted successfully:", oldImagePath);
        } else {
          console.log("Old profile image file not found:", oldImagePath);
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
    busthis.sinesaddress ||
    profile ||
    password;

  if (!hasUpdates) {
    return res.status(200).json({
      success: true,
      message: "No changes provided",
      user: user,
    });
  }

  try {
    // If password is being updated, set it directly on the user object
    // The pre-save middleware will handle the hashing
    if (password) {
      console.log("Updating password for user:", userId);
      user.password = password;
    }

    // Save the user - this will trigger the pre-save middleware for password hashing
    await user.save();

    // Fetch the updated user without password
    const updatedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    // If database operation fails and a new image was uploaded, delete it
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
  res.json({ users: users });
});

const deleteuser = asynchandler(async (req, res) => {
  const { id } = req.body;

  // Find the user first to get the profile image path
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Delete the profile image if it exists
  if (user.profile) {
    const imagePath = path.join(process.cwd(), "public", user.profile);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Profile image deleted successfully:", imagePath);
      } else {
        console.log("Profile image file not found:", imagePath);
      }
    } catch (error) {
      console.error("Error deleting profile image:", error);
    }
  }

  // Delete the user record
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

export const logout = asynchandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
    samesite: "none",
    path: "/",
  };
  res.clearCookie("accesstoken", options);
  res.json({ message: "logged out successfully" });
});

export const verifyuser = asynchandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (user) {
    user.verified = true;
    await user.save();
    res.json({ message: "User verified successfully" });
  } else {
    res.json({ message: "User not found" });
  }
});

export const addloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;

  const user = await User.findById(req.user.id);
  if (user) {
    user.loyalty_points += points;
    await user.save();
    res.json({ message: "Loyalty points added successfully", user: user });
  } else {
    res.json({ message: "User not found" });
  }
});

export const redeemloyaltypoints = asynchandler(async (req, res) => {
  const { points } = req.body;

  const user = await User.findById(req.user.id);
  if (user) {
    user.loyalty_points -= points;
    await user.save();
    res.json({ message: "Loyalty points redeemed successfully", user: user });
  } else {
    res.json({ message: "User not found" });
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
  res.json({ message: "Product added to favourites", user: user });
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
  res.json({ message: "Product removed from favorites", user: user });
});

export const getfavourites = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const favorites = await ShoppingItem.find({ _id: { $in: user.favorites } });
  res.json({ favorites: favorites });
});

export const addtoorderhistory = asynchandler(async (req, res) => {
  const { orderid } = req.body;
  const order = await Order.findById(orderid);
  if (!order) {
    throw new apierror(404, "Order not found");
  }
  const user = await User.findById(req.user.id);
  user.orderhistory.push(orderid);
  await user.save();
  res.json({ message: "Order added to order history", user: user });
});

export const getorderhistory = asynchandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const orderhistory = await Order.find({
    _id: { $in: user.orderhistory },
  }).populate("products.product");
  res.json({ orderhistory: orderhistory });
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
  const user = await User.findOne({ email: email });

  // Check if user exists
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User does not exist",
    });
  }

  // Check if user is verified - only require verification for stock users
  if (user.type === "stock" && !user.verified) {
    return res.status(401).json({
      success: false,
      message: "Stock users must verify their account before logging in",
    });
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Password validation result:", isPasswordValid);

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

  // Return success response with token and user data
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

export {
  registeruser,
  login,
  resendotp,
  delunverifiedusers,
  updateprofile,
  getallusers,
  deleteuser,
  verifyotp,
  forgotpassword,
  resetpassword,
};
