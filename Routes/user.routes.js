import { Router } from "express";
import {
  deleteuser,
  addloyaltypoints,
  redeemloyaltypoints,
  getallusers,
  login,
  logout,
  registeruser,
  updateprofile,
  addtofavourites,
  removefromfavourites,
  getfavourites,
  addtoorderhistory,
  getorderhistory,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  deleteUserAccount,
} from "../controllers/user.controller.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";
import { newupload } from "../middelwares/multer.middelware2.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";

const router = Router();

router.route("/signup").post(newupload.single("profile"), registeruser);
router.route("/verify-otp").post(verifyOTP);
router.route("/resend-otp").post(resendOTP);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/me").get(verifyjwt, asynchandler(async (req, res) => {
  if (!req.user) {
    throw new apierror(401, "Unauthorized: User not found");
  }
  res.status(200).json({ user: req.user });
}));
router
  .route("/updateprofile")
  .post(verifyjwt, newupload.single("profile"), updateprofile);
router.route("/getallusers").get(getallusers);
router.route("/deleteuser").post(deleteuser);
router.route("/delete-account").post(verifyjwt, deleteUserAccount);
router.route("/addloyaltypoints").post(verifyjwt, addloyaltypoints);
router.route("/redeemloyaltypoints").post(verifyjwt, redeemloyaltypoints);
router.route("/addtofavourites").post(verifyjwt, addtofavourites);
router.route("/removefromfavourites").post(verifyjwt, removefromfavourites);
router.route("/getfavourites").get(verifyjwt, getfavourites);
router.route("/addtoorderhistory").post(verifyjwt, addtoorderhistory);
router.route("/getorderhistory").get(verifyjwt, getorderhistory);

export default router;