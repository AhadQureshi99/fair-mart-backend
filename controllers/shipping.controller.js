import { Shipping } from "../models/shipping.model.js";

export const createShipping = async (req,res)=>{
    try {
        const {price} = req.body;
        const shipping = await Shipping.create({price});
        res.status(201).json(shipping);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getShipping = async (req,res)=>{
    try {
        const shipping = await Shipping.find();
        res.status(200).json(shipping);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const updateShipping = async (req,res)=>{
    try {
        const {id} = req.params;
        const {price} = req.body;
        const shipping = await Shipping.findByIdAndUpdate(id,{price},{new:true});
        res.status(200).json(shipping);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const deleteShipping = async (req,res)=>{
    try {
        const {id} = req.params;
        await Shipping.findByIdAndDelete(id);
        res.status(200).json({message:"Shipping deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}