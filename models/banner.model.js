import mongoose,{Schema} from "mongoose";

const bannerSchema = new Schema({
    image:{
        type:String,
        required:true
    }
})

export const Banner = mongoose.model("Banner",bannerSchema);
