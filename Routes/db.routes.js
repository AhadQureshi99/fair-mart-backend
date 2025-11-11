import { Router } from "express";
import { clearDatabase } from "../controllers/db.controller.js";

const router = Router();

// Protected route - only accessible by admin users
router.route('/clear').delete(clearDatabase);

export default router; 