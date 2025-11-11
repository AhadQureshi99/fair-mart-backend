import { About } from "../models/about.model.js";
import fs from "fs";
import path from "path";

export const createAbout = async (req,res) => {
    const {title,description} = req.body;
    
    // Check if an image was uploaded
    if (!req.file) {
        return res.status(400).json({message: "Image is required"});
    }
    
    try {
        const about = await About.create({
            title,
            description,
            image: req.file.filename
        });
        res.status(201).json(about);
    } catch (error) {
        // If database operation fails, delete the uploaded image
        if (req.file) {
            const imagePath = path.join(process.cwd(), "public", req.file.filename);
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

export const getAbout = async (req,res) => {
    try {
        const about = await About.find();
        res.status(200).json(about);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getAboutById = async (req,res) => {
    const {id} = req.params;
    try {
        const about = await About.findById(id);
        res.status(200).json(about);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const updateAbout = async (req,res) => {
    const {id} = req.params;
    const about = await About.findById(id);
    if(!about){
        return res.status(404).json({message:"About not found"});
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
        if(about.image) {
            const oldImagePath = path.join(process.cwd(), "public",  about.image);
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

    // If no fields were provided to update, return the existing about
    if(Object.keys(updateData).length === 0 && !req.file) {
        return res.status(200).json(about);
    }

    try {
        const updatedAbout = await About.findByIdAndUpdate(id, updateData, {new:true});
        res.status(200).json(updatedAbout);
    } catch (error) {
        // If database operation fails and a new image was uploaded, delete it
        if (newImageFilename) {
            const imagePath = path.join(process.cwd(), "public",  newImageFilename);
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

export const deleteAbout = async (req,res) => {
    const {id} = req.params;
    try {
        const about = await About.findById(id);
        if(!about) {
            return res.status(404).json({message:"About not found"});
        }
        
        // Delete the image file if it exists
        if(about.image) {
            const imagePath = path.join(process.cwd(), "public", about.image);
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
        
        // Delete the about record
        await About.findByIdAndDelete(id);
        res.status(200).json({message:"About deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}