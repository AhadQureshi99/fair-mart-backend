import { Achievement } from "../models/achievement.model.js";
import fs from "fs";
import path from "path";

export const createAchievement = async (req,res) => {
    const {title,description} = req.body;
    
    // Check if an image was uploaded
    if (!req.file) {
        return res.status(400).json({message: "Image is required"});
    }
    
    try {
        const achievement = await Achievement.create({
            title,
            description,
            image: req.file.filename
        });
        res.status(201).json(achievement);
    } catch (error) {
        // If database operation fails, delete the uploaded image
        if (req.file) {
            const imagePath = path.join(process.cwd(), "public",  req.file.filename);
            try {
                if(fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log("Image deleted after failed operation:", imagePath);
                }
            } catch (deleteError) {
                console.error("Error deleting image after failed operation:", deleteError);
            }
        }
        res.status(500).json({message:error.message});
    }
}

export const getAchievement = async (req,res) => {
    try {
        const achievement = await Achievement.find();
        res.status(200).json(achievement);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getAchievementById = async (req,res) => {
    const {id} = req.params;
    try {
        const achievement = await Achievement.findById(id);
        res.status(200).json(achievement);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const updateAchievement = async (req,res) => {
    const {id} = req.params;
    const achievement = await Achievement.findById(id);
    if(!achievement){
        return res.status(404).json({message:"Achievement not found"});
    }
    
    // Create updateData object with only the fields that are provided
    let updateData = {};
    
    // Only add fields to updateData if they are provided in the request
    if(req.body.title) updateData.title = req.body.title;
    if(req.body.description) updateData.description = req.body.description;
    
    // Store the new image filename if a new image is uploaded
    let newImageFilename = null;
    
    // Handle image update if a new image is provided
    if(req.file){
        newImageFilename = req.file.filename;
        
        // Delete the old image if it exists
        if(achievement.image) {
            const oldImagePath = path.join(process.cwd(), "public", achievement.image);
            try {
                if(fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Old image deleted successfully:", oldImagePath);
                } else {
                    console.log("Old image file not found:", oldImagePath);
                }
            } catch (error) {
                console.error("Error deleting old image:", error);
            }
        }
        updateData.image = newImageFilename;
    }

    // If no fields were provided to update, return the existing achievement
    if(Object.keys(updateData).length === 0 && !req.file) {
        return res.status(200).json(achievement);
    }

    try {
        const updatedAchievement = await Achievement.findByIdAndUpdate(id, updateData, {new:true});
        res.status(200).json(updatedAchievement);
    } catch (error) {
        // If database operation fails and a new image was uploaded, delete it
        if (newImageFilename) {
            const imagePath = path.join(process.cwd(), "public", newImageFilename);
            try {
                if(fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log("New image deleted after failed update:", imagePath);
                }
            } catch (deleteError) {
                console.error("Error deleting new image after failed update:", deleteError);
            }
        }
        res.status(500).json({message:error.message});
    }
}

export const deleteAchievement = async (req,res) => {
    const {id} = req.params;
    try {
        const achievement = await Achievement.findById(id);
        if(!achievement) {
            return res.status(404).json({message:"Achievement not found"});
        }
        
        // Delete the image file if it exists
        if(achievement.image) {
            const imagePath = path.join(process.cwd(), "public", achievement.image);
            try {
                if(fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log("Image deleted successfully:", imagePath);
                } else {
                    console.log("Image file not found:", imagePath);
                }
            } catch (error) {
                console.error("Error deleting image:", error);
            }
        }
        
        // Delete the achievement record
        await Achievement.findByIdAndDelete(id);
        res.status(200).json({message:"Achievement deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}