import mongoose, { Mongoose, Schema } from "mongoose";
// import { ShoppingItem } from "./shoppingitem.model.js";
// const itemCategorySchema = new Schema({
//   name: {
//     type: String,
//     required: true,
//     lowercase: true,
//     trim: true
//   },
//   items: [{
//     type: Schema.Types.ObjectId,
//     ref: "ShoppingItem"
//   }]
// });

// const subCategorySchema = new Schema({
//   name: {
//     type: String,
//     required: true,
//     lowercase: true,
//     trim: true
//   },
//   item_category: [itemCategorySchema]
// });

// const categorySchema = new Schema({
//   main_category: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   sub_category: [subCategorySchema]
// });

// export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const categorySchema = new Schema({
  main_category: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  sub_categories: [
    {
      sub_category: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },
      item_categories: [
        {
          item_category: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
          },
          items: [
            {
              type: Schema.Types.ObjectId,
              ref: "ShoppingItem"
            }
          ]
        }
      ]
    }
  ]
});

export const Category=mongoose.model("Category",categorySchema)

/**
 * Automatically add items to the corresponding categories
 */
// ShoppingItem.schema.post("save", async function (doc) {
//   try {
//     const { main_category, sub_category, item_category, _id } = doc;

//     const category = await Category.findOne({ main_category });

//     if (category) {
//       let subCategory = category.sub_category.find(
//         sub => sub.name === sub_category
//       );

//       if (!subCategory) {
//         subCategory = { name: sub_category, item_category: [] };
//         category.sub_category.push(subCategory);
//       }

//       let itemCat = subCategory.item_category.find(
//         cat => cat.name === item_category
//       );

//       if (!itemCat) {
//         itemCat = { name: item_category, items: [] };
//         subCategory.item_category.push(itemCat);
//       }

//       if (!itemCat.items.some(item => item.equals(_id))) {
//         itemCat.items.push(_id);
//       }

//       await category.save();
//     } else {
//       await Category.create({
//         main_category,
//         sub_category: [{
//           name: sub_category,
//           item_category: [{
//             name: item_category,
//             items: [_id]
//           }]
//         }]
//       });
//     }
//   } catch (error) {
//     console.error("Error automatically adding item to category:", error);
//   }
// });
