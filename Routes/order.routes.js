import { Router } from "express";

import { createOrder, getOrders,getOrder, updateOrder, deleteOrder, getAllOrders, getOrdersByStatus } from "../controllers/order.controller.js";
import { verifyjwt } from "../middelwares/auth.middleware.js";

const router = Router();

router.route('/create').post(verifyjwt,createOrder);
router.route('/get').get(verifyjwt,getOrders);
router.route('/:id').get(verifyjwt,getOrder);
router.route('/:id').post(verifyjwt,updateOrder);
router.route('/:id').delete(verifyjwt,deleteOrder);
router.route('/').get(verifyjwt,getAllOrders);
router.route('/status/:status').get(verifyjwt,getOrdersByStatus);

export default router;
