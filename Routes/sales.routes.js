import express from "express";
import { createSales, getSales, getSalesById, updateSales, deleteSales } from "../controllers/sales.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";
 
const router = express.Router();

router.post("/",newupload.single("image"),createSales);
router.get("/", getSales);
router.get("/:id", getSalesById);
router.put("/:id",newupload.single("image"), updateSales);
router.delete("/:id", deleteSales);

export default router;
