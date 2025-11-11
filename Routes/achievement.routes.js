import { Router } from "express";
import { createAchievement, deleteAchievement, getAchievement, getAchievementById, updateAchievement } from "../controllers/achievement.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";
const router = Router();

router.post("/",newupload.single("image"),createAchievement);
router.get("/",getAchievement);
router.get("/:id",getAchievementById);
router.put("/:id",newupload.single("image"),updateAchievement);
router.delete("/:id",deleteAchievement);

export default router;
