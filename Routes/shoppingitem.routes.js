import { Router } from "express";
import { addcolors, addimages, addshoppingitems, deletecolor, deleteimage, deleteshoppingitem, getshoppingitem, getshoppingitems } from "../controllers/shoppingitem.controller.js";
import { upload } from "../middelwares/multer.middelware.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";


const router=Router()

router.route('/additem').post(verifyjwt,upload.single('csv'),addshoppingitems)
router.route('/').get(getshoppingitems)
router.route('/deleteitem/:id').delete(verifyjwt,deleteshoppingitem)
router.route('/addimages').post(verifyjwt,upload.array('images'),addimages)
router.route('/getitem').post(verifyjwt,getshoppingitem)
router.route('/addcolors').post(verifyjwt,upload.array('colors'),addcolors)
router.route('/deletecolor').delete(verifyjwt,deletecolor)
router.route('/deleteimage/:id').delete(verifyjwt,deleteimage)
export default router