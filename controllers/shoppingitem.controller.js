import { ShoppingItem } from "../models/shoppingitem.model.js";
import fs from 'fs';
import csv from 'csv-parser';
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import path from 'path';
import { User } from "../models/user.model.js";
import { Category } from "../models/Category.model.js";

const updateExisting = true;
export const addshoppingitems = asynchandler(async (req, res) => {
  const results = [];
  const file = req.file;
  const filePath = path.resolve(file.path);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const item of results) {
          // Normalize category strings
          const normalizedMainCategory = item.Domain_Name.trim().toLowerCase();
          const normalizedSubCategory = item.Department_Name.trim().toLowerCase();
          const normalizedItemCategory = item.ArticleGroup_Name.trim().toLowerCase();

          // Find existing shopping item by custom id
          let shoppingItemDoc = await ShoppingItem.findOne({ id: item.Article_No });
          if (shoppingItemDoc) {
            // Update the item if flag is set
            if (updateExisting) {
              shoppingItemDoc = await ShoppingItem.findOneAndUpdate(
                { id: item.Article_No },
                {
                  main_category: normalizedMainCategory,
                  sub_category: normalizedSubCategory,
                  item_category: normalizedItemCategory,
                  discountprice: item.Discount_Price,
                  orignalprice: item.GrossSale_Price,
                  itemfullname: item.Article_Name,
                  brand: item.Brand,
                  fulldesciption: item.Full_Desciption,
                  descriptionpoints: item.Description_Points,
                  description: item.Description,
                  wholesale_discountprice: item.WholeSaleDiscounted_Price,
                  wholesale_orignalprice: item.WholeSale_Price,
                  loyaltypoints: item.loyaltypoints_size,
                },
                { new: true }
              );
            }
          } else {
            // Create new shopping item if not found
            shoppingItemDoc = await ShoppingItem.create({
              id: item.Article_No,
              main_category: normalizedMainCategory,
              sub_category: normalizedSubCategory,
              item_category: normalizedItemCategory,
              discountprice: item.Discount_Price,
              orignalprice: item.GrossSale_Price,
              itemfullname: item.Article_Name,
              brand: item.Brand,
              fulldesciption: item.Full_Desciption,
              descriptionpoints: item.Description_Points,
              description: item.Description,
              wholesale_discountprice: item.WholeSaleDiscounted_Price,
              wholesale_orignalprice: item.WholeSale_Price,
              loyaltypoints: item.loyaltypoints_size,
            });
          }

          // Process the Category document
          let main_cat = await Category.findOne({ main_category: normalizedMainCategory });
          if (!main_cat) {
            // If main category doesn't exist, create it with sub and item category
            main_cat = await Category.create({
              main_category: normalizedMainCategory,
              sub_categories: [
                {
                  sub_category: normalizedSubCategory,
                  item_categories: [
                    {
                      item_category: normalizedItemCategory,
                      items: [shoppingItemDoc._id]
                    }
                  ]
                }
              ]
            });
          } else {
            // Find the sub-category entry
            let subCatIndex = main_cat.sub_categories.findIndex(
              (sub) => sub.sub_category === normalizedSubCategory
            );
            if (subCatIndex === -1) {
              // Create new sub-category with item category if not found
              main_cat.sub_categories.push({
                sub_category: normalizedSubCategory,
                item_categories: [
                  {
                    item_category: normalizedItemCategory,
                    items: [shoppingItemDoc._id]
                  }
                ]
              });
            } else {
              // Get the existing sub-category
              const subCat = main_cat.sub_categories[subCatIndex];
              // Find the item category within the sub-category
              let itemCatIndex = subCat.item_categories.findIndex(
                (ic) => ic.item_category === normalizedItemCategory
              );
              if (itemCatIndex === -1) {
                // If item category doesn't exist, add a new one
                subCat.item_categories.push({
                  item_category: normalizedItemCategory,
                  items: [shoppingItemDoc._id]
                });
              } else {
                // Otherwise, add the shopping item to the existing item category if not already present
                const itemCat = subCat.item_categories[itemCatIndex];
                if (!itemCat.items.some(
                  (id) => id.toString() === shoppingItemDoc._id.toString()
                )) {
                  itemCat.items.push(shoppingItemDoc._id);
                }
              }
              // Update the sub-category entry
              main_cat.sub_categories[subCatIndex] = subCat;
            }
            await main_cat.save();
          }
        }

        if (results.length > 0) {
          fs.unlinkSync(filePath);
          // Populate shopping item details in subcategories/item_categories
          const populatedCategories = await Category.find()
            .populate("sub_categories.item_categories.items");
          return res.json(new apiresponse(200, "Items added successfully", populatedCategories));
        }
      } catch (error) {
        console.error(error);
        res.status(500).send("Error processing shopping items");
      }
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Error reading the CSV file");
    });
});

export const getshoppingitems = asynchandler(async (req, res) => {
  const items = await ShoppingItem.find();
  return res.json(new apiresponse(200, items,"Shopping items fetched successfully"));
});

export const deleteshoppingitem=asynchandler(async(req,res)=>{
  const {id}=req.params;
  const item=await ShoppingItem.findOneAndDelete({id:id});
  if(!item){
    return res.json(new apierror(404, "No item found with the given id"));
  }else{
     fs.unlinkSync(path.resolve(`public/${item.imgsrc}`));
    return res.json(new apiresponse(200, "Item deleted successfully", item));
  }
});

export const addimages = asynchandler(async (req, res) => {
  try {
    const images = req.files;

    const updatePromises = images.map(async (image) => {
      const itemId = image.originalname.split('.')[0];

      const updatedItem = await ShoppingItem.findOneAndUpdate(
        { id: itemId },
        { imgsrc: image.filename },
        { new: true }
      );

      if (!updatedItem) {
        console.warn(`No shopping item found with id: ${itemId}`);
      }

      return updatedItem;
    });

    await Promise.all(updatePromises);

    return res.json({ status: 200, message: "Images added successfully" });

  } catch (error) {
    console.error("Error adding images:", error);
    return res.json(new apierror(500, "Error adding images", error));
  }
});


export const getshoppingitem = asynchandler(async (req, res) => {
  const { id } = req.body;
  const item = await ShoppingItem
    .findById(id)
     
  if (!item) {
    return res.json(new apierror(404, "No item found with the given id"));
  }
  return res.json(new apiresponse(200, "Item fetched successfully", item));
});

export const addcolors = asynchandler(async (req, res) => {
try {
  const colors = req.files;
  for(const color of colors){
    const itemId = color.originalname.split('.')[0];
    const updatedItem = await ShoppingItem.findOne({ id: itemId });
    if (!updatedItem) {
      console.warn(`No shopping item found with id: ${itemId}`);
    }
    updatedItem.colors.push(color.filename);
    await updatedItem.save();

  }
  return res.json({ status: 200, message: "Colors added successfully" });
} catch (error) {
  console.error("Error adding colors:", error);
  return res.json(new apierror(500, "Error adding colors", error));
}
});

export const deletecolor = asynchandler(async (req, res) => {

  const { id, color } = req.body;
  const item = await ShoppingItem.findOne({
    id: id
  });
  if (!item) {
    return res.json(new apierror(404, "No item found with the given id"));
  }
  const index = item.colors.indexOf(color);
  if (index > -1) {
    item.colors.splice(index, 1);
  }
  await item.save();
  return res.json(new apiresponse(200, "Color deleted successfully", item));
}
);
export const deleteimage = asynchandler(async (req, res) => {
  const { id } = req.params;
  const item = await ShoppingItem.findOne({
    id: id
  });
  if (!item) {
    return res.json(new apierror(404, "No item found with the given id"));
  }
  fs.unlinkSync(path.resolve(`public/${item.imgsrc}`));
  item.imgsrc = "";
  await item.save();
  return res.json(new apiresponse(200, "Image deleted successfully", item));
});

 