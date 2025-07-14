import mongoose,{Schema} from "mongoose";

const shippingSchema = new Schema({
    price:{
        type:Number,
        required:true
    }
})

export const Shipping = mongoose.model("Shipping",shippingSchema);

 