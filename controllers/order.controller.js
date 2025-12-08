import { Order } from "../models/orders.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { apiresponse } from "../utils/responsehandler.js";
import { Category } from "../models/Category.model.js";

export const createOrder = asynchandler(async (req, res) => {
  const { products, shippingAddress, paymentMethod, shippingcost, total } =
    req.body;
  const user = req.user._id;
  const order = await Order.create({
    user,
    products,
    shippingAddress,
    paymentMethod,
    shippingcost,
    total,
  });
  await User.findByIdAndUpdate(user, { $push: { orders: order._id } });
  // Also add to the user's order history for quick retrieval
  await User.findByIdAndUpdate(user, {
    $addToSet: { orderhistory: order._id },
  });
  res.status(201).json(new apiresponse(true, order));
});

export const getOrders = asynchandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("user")
    .populate({
      path: "products.product",
      model: "ShoppingItem",
    });
  res.status(200).json(new apiresponse(true, orders));
});
export const getOrder = asynchandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user").populate({
    path: "products.product",
    model: "ShoppingItem",
  });
  if (!order) {
    throw new apierror(404, "Order not found");
  }
  res.status(200).json(new apiresponse(true, order));
});

export const updateOrder = asynchandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new apierror(404, "Order not found");
  }
  order.status = req.body.status;
  await order.save();
  res.status(200).json(new apiresponse(true, order));
});

export const deleteOrder = asynchandler(async (req, res) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    throw new apierror(404, "Order not found");
  }
  await Order.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(order.user, { $pull: { orders: order._id } });
  res.status(200).json(new apiresponse(true, "Order deleted successfully"));
});

export const getAllOrders = asynchandler(async (req, res) => {
  const orders = await Order.find({}).populate("user").populate({
    path: "products.product",
    model: "ShoppingItem",
  });
  res.status(200).json(new apiresponse(true, orders));
});

export const getOrdersByStatus = asynchandler(async (req, res) => {
  const orders = await Order.find({ status: req.params.status }).populate({
    path: "products.product",
    model: "ShoppingItem",
  });
  res.status(200).json(new apiresponse(true, orders));
});
