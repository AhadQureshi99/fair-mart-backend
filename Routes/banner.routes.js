import { Router } from "express";
import { createBanner, getBanners, getBannerById, updateBanner, deleteBanner } from "../controllers/banner.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";

const router = Router();

router.post("/",newupload.single("image"),createBanner);
router.get('/',getBanners);
router.get('/:id',getBannerById);
router.put('/:id',newupload.single("image"),updateBanner);
router.delete('/:id',deleteBanner);

export default router;
