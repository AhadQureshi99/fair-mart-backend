import express from "express";
import { createAbout, getAbout, getAboutById, updateAbout, deleteAbout } from "../controllers/about.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";
 

const router = express.Router();
 

router.post("/",newupload.single("image"),createAbout);
router.get("/",getAbout);
router.get("/:id",getAboutById);
router.put("/:id",newupload.single("image"),updateAbout);
router.delete("/:id",deleteAbout);

export default router;
