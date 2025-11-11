import mongoose,{Schema} from "mongoose";

const shoppingitemSchema = new Schema({
    main_category: {
        type: String,
        
        lowercase: true,
        trim: true,
    },
    id:{
        type:Number,
        required:true,
        unique:true,
    },
    sub_category: {
        type: String,
      
        lowercase: true,
        trim: true,
    },
    item_category: {
        type: String,
         
        lowercase: true,
        trim: true,
    },
    imgsrc: {
        type: String,
        default:0
    },
    discountprice: {
        type: Number,
        required: true,
        default: 0,
    },
    orignalprice: {
        type: Number,
        required: true,
    },
    itemfullname: {
        type: String,
        required: true,
       
    },
    brand:{
        type:String,
        required:true,
        default:0
    },
    colors:[
        {
            type:String,
            default:0
        },

    ],
    fulldesciption:{   
        type:String,
         default:0
    },
    descriptionpoints:[
        {
            type:String,
            default:0
        },
    ],
    description:{
        type:String,
        default:0
    },
    quantity:{
        type:Number,
        default:1
    },
    
    wholesale_discountprice:{
        type:Number,
        default:0
    },
    wholesale_orignalprice:{
        type:Number,
        default:0
    },
    loyaltypoints:{
        type:Number,
        default:0
    },
    
}, { timestamps: true });

// Add indexes for better query performance
shoppingitemSchema.index({ main_category: 1 });
shoppingitemSchema.index({ sub_category: 1 });
shoppingitemSchema.index({ item_category: 1 });
shoppingitemSchema.index({ brand: 1 });
shoppingitemSchema.index({ discountprice: 1 });
// Removed duplicate index on id (already covered by descending index below)

// Compound indexes for common filter combinations
shoppingitemSchema.index({ main_category: 1, sub_category: 1 });
// Optimized index for sorting by id (descending) - critical for performance
shoppingitemSchema.index({ id: -1 });
// Compound indexes for filtered sorts
shoppingitemSchema.index({ main_category: 1, id: -1 });
shoppingitemSchema.index({ sub_category: 1, id: -1 });
shoppingitemSchema.index({ brand: 1, id: -1 });
shoppingitemSchema.index({ main_category: 1, discountprice: 1 });
shoppingitemSchema.index({ brand: 1, discountprice: 1 });

// Text index for search functionality
shoppingitemSchema.index({ 
  itemfullname: 'text', 
  brand: 'text', 
  description: 'text' 
});

export const ShoppingItem = mongoose.model('ShoppingItem', shoppingitemSchema, 'shoppingitems');
    

