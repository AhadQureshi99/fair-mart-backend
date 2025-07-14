 
import { Sales } from "../models/sales.model.js";
import fs from "fs";
import path from "path";

export const createSales = async (req,res) => {
    const image = req.file;
    try {
        if(!image){
            return res.status(400).json({message:"Image is required"});
        }
        const sales = await Sales.create({image:image.filename});
        res.status(201).json(sales);
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

export const getSales = async (req,res) => {
    try {
        const sales = await Sales.find();
        res.status(200).json(sales);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const getSalesById = async (req,res) => {   
    const {id} = req.params;
    try {
        const sales = await Sales.findById(id);
        res.status(200).json(sales);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const updateSales = async (req,res) => {
    const {id} = req.params;
    const sales = await Sales.findById(id);
    if(!sales){
            return res.status(404).json({message:"Sales not found"});
    }
    
    const image = req.file;
    if(image){
        // Store the new image filename
        const newImageFilename = image.filename;
        
        // Delete the old image if it exists
        if(sales.image) {
            const oldImagePath = path.join(process.cwd(), "public", sales.image);
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
            sales.image = newImageFilename;
            await sales.save();
            res.status(200).json(sales);
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
        // No new image provided, just return the existing sales
        res.status(200).json(sales);
    }
}

export const deleteSales = async (req,res) => {
    const {id} = req.params;
    try {
        const sales = await Sales.findById(id);
        if(!sales) {
            return res.status(404).json({message:"Sales not found"});
        }
        
        // Delete the image file if it exists
        if(sales.image) {
            const imagePath = path.join(process.cwd(), "public", sales.image);
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
        
        // Delete the sales record
        await Sales.findByIdAndDelete(id);
        res.status(200).json({message:"Sales deleted successfully"});
    }catch(error){
        res.status(500).json({message:error.message});
    }
}
