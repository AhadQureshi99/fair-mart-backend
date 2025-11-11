import { Event } from "../models/event.model.js";
import fs from "fs";
import path from "path";
export const createEvent = async (req,res) => {
    const {name,description,startDate,endDate,location} = req.body;
    
    // Check if an image was uploaded
    if (!req.file) {
        return res.status(400).json({message: "Image is required"});
    }
    
    try {
        const event = await Event.create({
            name,
            description,
            startDate,
            endDate,
            location,
            image: req.file.filename
        });
        res.status(201).json(event);
    } catch (error) {
        // If database operation fails, delete the uploaded image
        if (req.file) {
            const imagePath = path.join(process.cwd(), "public",req.file.filename);
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

export const getEvents = async (req,res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const getEventById = async (req,res) => {
    const {id} = req.params;
    try {
        const event = await Event.findById(id);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
    
    
}

export const updateEvent = async (req,res) => {
    const {id} = req.params;
    const event = await Event.findById(id);
    if(!event){
        return res.status(404).json({message:"Event not found"});
    }
    
    // Create updateData object with only the fields that are provided
    let updateData = {};
    
    // Only add fields to updateData if they are provided in the request
    if(req.body.name) updateData.name = req.body.name;
    if(req.body.description) updateData.description = req.body.description;
    if(req.body.startDate) updateData.startDate = req.body.startDate;
    if(req.body.endDate) updateData.endDate = req.body.endDate;
    if(req.body.location) updateData.location = req.body.location;
    
    // Store the new image filename if a new image is uploaded
    let newImageFilename = null;
    
    // Handle image update if a new image is provided
    if(req.file){
        newImageFilename = req.file.filename;
        
        // Delete the old image if it exists
        if(event.image) {
            const oldImagePath = path.join(process.cwd(), "public", event.image);
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

    // If no fields were provided to update, return the existing event
    if(Object.keys(updateData).length === 0 && !req.file) {
        return res.status(200).json(event);
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {new:true});
        res.status(200).json(updatedEvent);
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

export const deleteEvent = async (req,res) => {
    const {id} = req.params;
    try {
        const event = await Event.findById(id);
        if(!event) {
            return res.status(404).json({message:"Event not found"});
        }
        
        // Delete the image file if it exists
        if(event.image) {
            const imagePath = path.join(process.cwd(), "public", event.image);
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
        
        // Delete the event record
        await Event.findByIdAndDelete(id);
        res.status(200).json({message:"Event deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

