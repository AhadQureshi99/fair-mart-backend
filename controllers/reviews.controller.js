import { Reviews } from "../models/reviews.model.js";

export const createReview = async (req,res) => {
    const {review,rating} = req.body;
    const user = req.user;
    if(!user){

        return res.status(401).json({message:"Unauthorized"});
    }
    let email = user.email; 
    let name = user.fullname;
    let userId = user.id;
    try {
        const createtedReview = await Reviews.create({review,rating,email,name,userId});
        res.status(201).json(createtedReview);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getReviews = async (req,res) => {
    try {
        const reviews = await Reviews.find().populate("userId","-password");
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getReviewById = async (req,res) => {
    const {id} = req.params;
    try {
        const review = await Reviews.findById(id).populate("userId","-password");
        if(!review){
            return res.status(404).json({message:"Review not found"});
        }
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const updateReview = async (req,res) => {
    const {id} = req.params;
    const {review,rating} = req.body;
    const user = req.user;
    if(!user){
        return res.status(401).json({message:"Unauthorized"});
    }
    let email = user.email;
    let name = user.fullname;
    try {
        const updatedReview = await Reviews.findByIdAndUpdate(id,{review,rating,email,name});
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const deleteReview = async (req,res) => {
    const {id} = req.params;
    try {
        const review = await Reviews.findById(id);
        if(!review){
            return res.status(404).json({message:"Review not found"});
        }
        await Reviews.findByIdAndDelete(id);
        res.status(200).json({message:"Review deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

