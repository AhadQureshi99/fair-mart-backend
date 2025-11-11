import { Category } from "../models/Category.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import fs from 'fs';

// export const addcategory = asynchandler(async (req, res) => {
//     const { main_category, sub_category } = req.body;
//     const existedCategory = await Category.findOne({ main_category });
//     if (existedCategory) {
//         return res.status(400).json({ message: "Category already exists" });
//     }
//     const category = await Category.create({
//         main_category,
//         sub_category
//     });
//     return res.json(new apiresponse(200, "Category added successfully", category));
// });

// export const addsubcategories = asynchandler(async (req, res) => {
//     const { main_category, sub_category } = req.body;
//     const existedCategory = await Category.findOne({ main_category }); 
//     if (!existedCategory) {
//         return res.status(400).json({ message: "Category does not exist" });
//     }
//     existedCategory.sub_category.push(sub_category);
//     await existedCategory.save();
//     return res.json(new apiresponse(200, "Sub category added successfully", existedCategory));
// });

// export const additemcategory = asynchandler(async (req, res) => {
//     const { main_category, sub_category, item_category } = req.body;
//     const existedCategory = await Category.findOne({ main_category });
//     if (!existedCategory) {
//         return res.status(400).json({ message: "Category does not exist" });
//     }
//     const subcategory = existedCategory.sub_category.find(sub => sub.sub_category === sub_category);
//     if (!subcategory) {
//         return res.status(400).json({ message: "Sub category does not exist" });
//     }
//     subcategory.item_category.push(item_category);
//     await existedCategory.save();
//     return res.json(new apiresponse(200, "Item category added successfully", existedCategory));
// });

// export const additem = asynchandler(async (req, res) => {
//     const { main_category, sub_category, item_category, item } = req.body;
//     const existedCategory = await Category.findOne({ main_category });
//     if (!existedCategory) {
//         return res.status(400).json({ message: "Category does not exist" });
//     }
//     const subcategory = existedCategory.sub_category.find(sub => sub.sub_category === sub_category);
//     if (!subcategory) {
//         return res.status(400).json({ message: "Sub category does not exist" });
//     }
//     const itemcategory = subcategory.item_category.find(itemcat => itemcat.item_category === item_category);
//     if (!itemcategory) {
//         return res.status(400).json({ message: "Item category does not exist" });
//     }
//     const existedItem = await ShoppingItem.findOne({ id: item.id });
//     if (existedItem) {
//         const updatedItem = await ShoppingItem.findOneAndUpdate({ id: item.id }, {
//             main_category,
//             sub_category,
//             item_category,
//             discountprice: item.discountprice,
//             orignalprice: item.orignalprice,
//             itemfullname: item.itemfullname,
//             brand: item.brand,
//             colors: item.colors,
//             fulldesciption: item.fulldesciption,
//             descriptionpoints: item.descriptionpoints,
//             description: item.description,
//             quantity: item.quantity
//         });
//     } else {
//         const shoppingitem = await ShoppingItem.create({
//             id: item.id,
//             main_category,
//             sub_category,
//             item_category,
//             discountprice: item.discountprice,
//             orignalprice: item.orignalprice,
//             itemfullname: item.itemfullname,
//             brand: item.brand,
//             colors: item.colors,
//             fulldesciption: item.fulldesciption,
//             descriptionpoints: item.descriptionpoints,
//             description: item.description,
//             quantity: item.quantity
//         });
//     }
//     return res.json(new apiresponse(200, "Item added successfully", item));
// });

// export const getshoppingitems=asynchandler(async(req,res)=>{
//     const {main_category,sub_category,item_category}=req.body;
//     const items=await ShoppingItem.find({main_category,sub_category,item_category});
//     return res.json(new apiresponse(200,"Shopping items fetched successfully",items));
// });
export const getallcategories = asynchandler(async (req, res) => {
  // Populate nested shopping items within each item category of each subcategory
  const categories = await Category.find().populate("sub_categories.item_categories.items");
  return res.json(new apiresponse(200, categories,"Categories fetched successfully"));
});

export const getcategory = asynchandler(async (req, res) => {
  const { id } = req.params;
  // Populate nested shopping items within each item category of each subcategory for the given category id
  const category = await Category.findById(id).populate("sub_categories.item_categories.items");
  return res.json(new apiresponse(200, "Category fetched successfully", category));
});

export const deletecategory = asynchandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOneAndDelete({ _id: id });
  if (!category) {
    return res.json(new apierror(404, "No category found with the given id"));
  } else {
    return res.json(new apiresponse(200, "Category deleted successfully", category));
  }
});
