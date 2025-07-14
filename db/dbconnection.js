import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

let connectdb=async()=>{
    try {
        let connectioninstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected !! DB Host:${connectioninstance.connection.host}`)
    } catch (error) {
        console.log('Mongo DB connection error',error)
    }
}

export {connectdb}