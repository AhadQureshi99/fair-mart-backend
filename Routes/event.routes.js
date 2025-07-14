import { Router } from "express";
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from "../controllers/event.controller.js";
import { newupload } from "../middelwares/multer.middelware2.js";

const router = Router();

router.post("/",newupload.single("image"),createEvent);
router.get("/",getEvents);
router.get("/:id",getEventById);
router.put("/:id",newupload.single("image"),updateEvent);
router.delete("/:id",deleteEvent);

export default router;

