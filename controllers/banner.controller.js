import { Banner } from "../models/banner.model.js";
import fs from "fs";
import path from "path";

export const createBanner = async (req,res) => {
    const image = req.file;
    try {
        if(!image){
            return res.status(400).json({message:"Image is required"});
        }
        const banner = await Banner.create({image:image.filename});
        res.status(201).json(banner);
    } catch (error) {
        // If database operation fails, delete the uploaded image
        if (image) {
            const imagePath = path.join(process.cwd(), "public", image.filename);
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

export const getBanners = async (req,res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json(banners);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const getBannerById = async (req,res) => {   
    const {id} = req.params;
    try {
        const banner = await Banner.findById(id);
        res.status(200).json(banner);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const updateBanner = async (req,res) => {
    const {id} = req.params;
    const banner = await Banner.findById(id);
    if(!banner){
        return res.status(404).json({message:"Banner not found"});
    }
    
    const image = req.file;
    if(image){
        // Store the new image filename
        const newImageFilename = image.filename;
        
        // Delete the old image if it exists
        if(banner.image) {
            const oldImagePath = path.join(process.cwd(), "public", banner.image);
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
        
        try {
            banner.image = newImageFilename;
            await banner.save();
            res.status(200).json(banner);
        } catch (error) {
            // If database operation fails, delete the new image
            const imagePath = path.join(process.cwd(), "public",  newImageFilename);
            try {
                if(fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log("New image deleted after failed update:", imagePath);
                }
            } catch (deleteError) {
                console.error("Error deleting new image after failed update:", deleteError);
            }
            res.status(500).json({message:error.message});
        }
    } else {
        // No new image provided, just return the existing banner
        res.status(200).json(banner);
    }
}

export const deleteBanner = async (req,res) => {
    const {id} = req.params;
    try {
        const banner = await Banner.findById(id);
        if(!banner) {
            return res.status(404).json({message:"Banner not found"});
        }
        
        // Delete the image file if it exists
        if(banner.image) {
            const imagePath = path.join(process.cwd(), "public", banner.image);
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
        
        // Delete the banner record
        await Banner.findByIdAndDelete(id);
        res.status(200).json({message:"Banner deleted successfully"});
    }catch(error){
        res.status(500).json({message:error.message});
    }
}
