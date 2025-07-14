import { Router } from "express";
import { deletecategory, getallcategories, getcategory } from "../controllers/Category.controller.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";

const router = Router();

router.route('/').get(getallcategories);
router.route('/get/:id').get(verifyjwt,getcategory)
router.route('/delete/:id').delete(verifyjwt,deletecategory)

export default router;