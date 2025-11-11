import mongoose,{Schema} from "mongoose";

const achievementSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    }

})

export const Achievement = mongoose.model("Achievement",achievementSchema);
