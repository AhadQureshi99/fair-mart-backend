import express from "express";
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/reviews.controller.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyjwt, createReview);
router.get("/", getReviews);
router.get("/:id", getReviewById);
router.put("/:id", verifyjwt, updateReview);
router.delete("/:id", deleteReview);

export default router;
