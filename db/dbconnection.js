import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Optimize mongoose settings for better performance
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);

let connectdb=async()=>{
    try {
        const connectionOptions = {
            // Connection pool settings
            maxPoolSize: 50, // Maximum number of connections
            minPoolSize: 5,  // Minimum number of connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            
            // Timeout settings
            serverSelectionTimeoutMS: 10000, // How long to try selecting a server
            socketTimeoutMS: 45000, // How long to wait for a response
            connectTimeoutMS: 10000, // How long to wait for initial connection
            
            // Performance optimizations
            // bufferMaxEntries is deprecated, using mongoose.set() instead
            
            // Compression
            compressors: ['zlib'],
            zlibCompressionLevel: 6,
            
            // Read preferences for better performance
            readPreference: 'secondaryPreferred',
            
            // Write concern for better performance (adjust based on your needs)
            writeConcern: {
                w: 'majority',
                j: false, // Don't wait for journal confirmation for better performance
                wtimeout: 10000
            }
        };
        
        let connectioninstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, connectionOptions);
        
        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });
        
        console.log(`MongoDB connected !! DB Host:${connectioninstance.connection.host}`);
        console.log(`Connection pool size: ${connectionOptions.maxPoolSize}`);
        
    } catch (error) {
        console.log('Mongo DB connection error',error);
        process.exit(1);
    }
}

export {connectdb}