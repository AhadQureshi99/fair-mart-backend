import { User } from "../models/user.model.js";
import { ShoppingItem } from "../models/shoppingitem.model.js";
import { Order } from "../models/orders.model.js";
import { Category } from "../models/Category.model.js";
import { Shipping } from "../models/shipping.model.js";
import { Event } from "../models/event.model.js";
import { About } from "../models/about.model.js";
import { Achievement } from "../models/achievement.model.js";
import { Banner } from "../models/banner.model.js";
import { Sales } from "../models/sales.model.js";
import { Reviews } from "../models/reviews.model.js";
import { News } from "../models/news.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";

const clearDatabase = asynchandler(async (req, res) => {
  

    try {
        // Delete all documents from each collection
        await Promise.all([
          
            ShoppingItem.deleteMany({}),
            Order.deleteMany({}),
            Category.deleteMany({}),
            Shipping.deleteMany({}),
            Event.deleteMany({}),
            About.deleteMany({}),
            Achievement.deleteMany({}),
            Banner.deleteMany({}),
            Sales.deleteMany({}),
            Reviews.deleteMany({}),
            News.deleteMany({})
        ]);

        return res.status(200).json({
            success: true,
            message: "Database cleared successfully"
        });
    } catch (error) {
        throw new apierror(500, "Error clearing database: " + error.message);
    }
});

export { clearDatabase }; 