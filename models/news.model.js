import mongoose,{Schema} from "mongoose";

const newsSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    shortdescription:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    }

})

export const News = mongoose.model("News",newsSchema);
