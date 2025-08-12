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
} from "../controllers/user.controller.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";
import { newupload } from "../middelwares/multer.middelware2.js";

const router = Router();

router.route("/signup").post(newupload.single("profile"), registeruser);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/me").get(verifyjwt, (req, res) => {
  res.json({ user: req.user });
});
router
  .route("/updateprofile")
  .post(verifyjwt, newupload.single("profile"), updateprofile);
router.route("/getallusers").get(getallusers);
router.route("/deleteuser").post(deleteuser);
router.route("/addloyaltypoints").post(verifyjwt, addloyaltypoints);
router.route("/redeemloyaltypoints").post(verifyjwt, redeemloyaltypoints);
router.route("/addtofavourites").post(verifyjwt, addtofavourites);
router.route("/removefromfavourites").post(verifyjwt, removefromfavourites);
router.route("/getfavourites").get(verifyjwt, getfavourites);
router.route("/addtoorderhistory").post(verifyjwt, addtoorderhistory);
router.route("/getorderhistory").get(verifyjwt, getorderhistory);

export default router;
