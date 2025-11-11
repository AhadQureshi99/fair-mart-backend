import mongoose,{Schema} from "mongoose";

const eventSchema = new Schema({
    name:{
        type:String,
        
    },
    description:{
        type:String,
    },
    startDate:{
        type:Date,
    },
    endDate:{
        type:Date,
    },
    location:{
        type:String,
    },
    image:{
        type:String,
    } 

})

export const Event = mongoose.model("Event",eventSchema);
