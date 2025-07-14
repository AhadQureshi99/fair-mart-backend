import mongoose,{Schema} from "mongoose";

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'ShoppingItem',
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
shippingAddress: {
        type:String
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card','bank'],
        default: 'cod',
    },
    shippingcost: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['placed', 'shipped', 'delivered'],
        default: 'placed',
    },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);