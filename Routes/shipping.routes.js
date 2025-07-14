import { Router } from "express";
import { createShipping, getShipping, updateShipping, deleteShipping } from "../controllers/shipping.controller.js";

const router = Router();

router.post("/",createShipping);
router.get("/",getShipping);
router.put("/:id",updateShipping);
router.delete("/:id",deleteShipping);

export default router;


