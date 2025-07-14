import mongoose,{Schema} from "mongoose";

const reviewsSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        ref:"User",
        required:true
    },
    email:{
        type:String,
        required:true
    },
    review:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true
    }
})

export const Reviews = mongoose.model("Reviews",reviewsSchema);
