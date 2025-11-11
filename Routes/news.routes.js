import express from "express";
import { createNews, getNews, getNewsById, updateNews, deleteNews } from "../controllers/news.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";
 

const router = express.Router();
 

router.post("/",newupload.single("image"),createNews);
router.get("/",getNews);
router.get("/:id",getNewsById);
router.put("/:id",newupload.single("image"),updateNews);
router.delete("/:id",deleteNews);
 

export default router;
