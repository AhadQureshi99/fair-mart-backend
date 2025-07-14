import mongoose,{Schema} from "mongoose";

const aboutSchema = new Schema({
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

export const About = mongoose.model("About",aboutSchema);
