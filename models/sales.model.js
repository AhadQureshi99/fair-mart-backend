import mongoose,{Schema} from "mongoose";

const SalesSchema = new Schema({
    image:{
        type:String,
        required:true
    }
})

export const Sales = mongoose.model("Sales",SalesSchema);
