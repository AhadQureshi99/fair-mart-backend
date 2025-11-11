import { ShoppingItem } from "../models/shoppingitem.model.js";
import fs from 'fs';
import csv from 'csv-parser';
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/responsehandler.js";
import { apierror } from "../utils/apierror.js";
import path from 'path';
import { User } from "../models/user.model.js";
import { Category } from "../models/Category.model.js";

// In-memory cache for shopping items - optimized and default all
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 100;

// Cache helper functions
const generateCacheKey = (query) => {
  return JSON.stringify({
    page: query.page || 1,
    limit: query.limit || 20,
    main_category: query.main_category,
    sub_category: query.sub_category,
    item_category: query.item_category,
    brand: query.brand,
    min_price: query.min_price,
    max_price: query.max_price,
    search: query.search,
    all: query.all,
    stream: query.stream
  });
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  // Clean old entries if cache is getting too large
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

const updateExisting = true;
const BATCH_SIZE = 100; // Process items in batches

export const addshoppingitems = asynchandler(async (req, res) => {
  const results = [];
  const file = req.file;
  if (!file) {
    return res.status(400).json(new apierror(400, "CSV file is required. Send as field 'csv' via multipart/form-data"));
  }
  const filePath = path.resolve(file.path);

  const normalizeKey = (key) => key.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  const normalizeRow = (row) => {
    const normalized = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
    }
    return normalized;
  };
  const getValue = (row, variants, def = undefined) => {
    for (const key of variants) {
      const nk = normalizeKey(key);
      if (row[nk] !== undefined && row[nk] !== '') return row[nk];
    }
    return def;
  };
  const toNumber = (val, def = 0) => {
    if (val === undefined || val === null || val === '') return def;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[, ]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : def;
  };

  // Detect CSV delimiter (comma, semicolon, or tab)
  let detectedSeparator = ',';
  try {
    const sample = fs.readFileSync(filePath, { encoding: 'utf8' }).slice(0, 4096);
    const counts = {
      ',': (sample.match(/,/g) || []).length,
      ';': (sample.match(/;/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
    };
    detectedSeparator = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ',';
  } catch (_) {
    detectedSeparator = ',';
  }

  fs.createReadStream(filePath)
    .pipe(csv({ separator: detectedSeparator }))
    .on("data", (data) => results.push(normalizeRow(data)))
    .on("end", async () => {
      try {
        // Process items in batches for better performance
        const totalItems = results.length;
        const processedItems = [];
        console.log(results);
        const categoryUpdates = new Map(); // Cache category updates
        
        console.log(`Processing ${totalItems} items in batches of ${BATCH_SIZE}`);
        if (totalItems === 0) {
          try {
            fs.unlinkSync(filePath);
          } catch (_) {}
          return res.status(400).json(new apierror(400, "No rows found in CSV"));
        }
        
        let totalInserted = 0;
        let totalModified = 0;
        let totalUpserts = 0;
        let totalPlannedInserts = 0;
        let totalPlannedUpdates = 0;
        const firstFiveIds = [];
        const writeErrors = [];
        let sampleDocument = null;

        // Quick validation that we can derive an ID from at least one row
        const idHeaderCandidates = ['Article_No','article_no','ArticleNo','Article No','id','ID'];
        const validIdCountProbe = results.slice(0, 10).reduce((acc, row) => {
          const v = toNumber(getValue(row, idHeaderCandidates));
          return acc + (Number.isFinite(v) && v > 0 ? 1 : 0);
        }, 0);
        if (validIdCountProbe === 0) {
          const availableHeaders = Object.keys(results[0] || {});
          try { fs.unlinkSync(filePath); } catch (_) {}
          return res.status(400).json(new apierror(400, "Could not find a valid ID column. Expected one of: Article_No, article_no, ArticleNo, Article No, id, ID", availableHeaders));
        }

        for (let i = 0; i < totalItems; i += BATCH_SIZE) {
          const batch = results.slice(i, i + BATCH_SIZE);
          console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(totalItems/BATCH_SIZE)}`);
          
          // Prepare batch operations
          const bulkOps = [];
          const itemIds = batch.map(item => toNumber(getValue(item, ['Article_No','article_no','ArticleNo','Article No','id','ID'])));
          const validItemIds = itemIds.filter((v) => Number.isFinite(v) && v > 0);
          
          // Get existing items in one query
          const existingItems = await ShoppingItem.find({ id: { $in: validItemIds } });
          const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
          
          // Process each item in the batch
          for (const item of batch) {
            const articleNo = toNumber(getValue(item, ['Article_No','article_no','ArticleNo','Article No','id','ID']));
            if (!Number.isFinite(articleNo) || articleNo <= 0) {
              continue; // skip invalid rows
            }
            if (firstFiveIds.length < 5) firstFiveIds.push(articleNo);
            const normalizedMainCategory = String(getValue(item, ['Domain_Name','domain_name','DomainName','Domain Name'], '')).toLowerCase().trim();
            const normalizedSubCategory = String(getValue(item, ['Department_Name','department_name','DepartmentName','Department Name'], '')).toLowerCase().trim();
            const normalizedItemCategory = String(getValue(item, ['ArticleGroup_Name','articlegroup_name','ArticleGroupName','Article Group Name'], '')).toLowerCase().trim();
            
            // Ensure required fields have valid values
            const discountPrice = toNumber(getValue(item, ['Discount_Price','discount_price','Discount Price','DiscountPrice']), 0);
            const originalPrice = toNumber(getValue(item, ['GrossSale_Price','grosssale_price','GrossSale Price','GrossSalePrice']), 0);
            const itemFullName = getValue(item, ['Article_Name','article_name','Article Name','ArticleName'], '') || 'Unnamed Item';
            const brandValue = getValue(item, ['Brand','brand'], '') || '0';
            
            // Skip items missing critical required fields
            if (!itemFullName || itemFullName.trim() === '') {
              console.warn(`Skipping item ${articleNo}: missing itemfullname`);
              continue;
            }
            
            const itemData = {
              id: articleNo,
              main_category: normalizedMainCategory,
              sub_category: normalizedSubCategory,
              item_category: normalizedItemCategory,
              discountprice: discountPrice,
              orignalprice: originalPrice,
              itemfullname: itemFullName.trim(),
              brand: brandValue.trim(),
              fulldesciption: getValue(item, ['Full_Desciption','full_desciption','Full Desciption','Full_Description','full_description','Full Description'], ''),
              descriptionpoints: (() => {
                const dp = getValue(item, ['Description_Points','description_points','Description Points'], '');
                if (Array.isArray(dp)) return dp;
                return String(dp || '').split('|').map(s => s.trim()).filter(Boolean);
              })(),
              description: getValue(item, ['Description','description'], ''),
              wholesale_discountprice: toNumber(getValue(item, ['WholeSaleDiscounted_Price','wholesalediscounted_price','Wholesale Discounted Price']), 0),
              wholesale_orignalprice: toNumber(getValue(item, ['WholeSale_Price','wholesale_price','Wholesale Price']), 0),
              loyaltypoints: toNumber(getValue(item, ['loyaltypoints_size','LoyaltyPoints_Size','LoyaltyPoints Size','loyalty_points','LoyaltyPoints']), 0),
            };
            
            if (existingItemsMap.has(articleNo)) {
              // Update existing item
              if (updateExisting) {
                bulkOps.push({
                  updateOne: {
                    filter: { id: articleNo },
                    update: { $set: itemData },
                    upsert: false
                  }
                });
                totalPlannedUpdates += 1;
              }
            } else {
              // Insert new item
              if (!sampleDocument && totalPlannedInserts === 0) {
                sampleDocument = JSON.parse(JSON.stringify(itemData));
              }
              bulkOps.push({
                insertOne: {
                  document: itemData
                }
              });
              totalPlannedInserts += 1;
            }
            
            // Cache category structure for later batch update
            const categoryKey = `${normalizedMainCategory}|${normalizedSubCategory}|${normalizedItemCategory}`;
            if (!categoryUpdates.has(categoryKey)) {
              categoryUpdates.set(categoryKey, {
                main_category: normalizedMainCategory,
                sub_category: normalizedSubCategory,
                item_category: normalizedItemCategory,
                itemIds: []
              });
            }
            categoryUpdates.get(categoryKey).itemIds.push(articleNo);
          }
          
          // Execute bulk operations for shopping items
          if (bulkOps.length > 0) {
            try {
              const writeResult = await ShoppingItem.bulkWrite(bulkOps, { 
                ordered: false,
                writeConcern: { w: 1 }
              });
              console.log('Bulk write result:', JSON.stringify(writeResult, null, 2));
              
              // Check for write errors
              if (writeResult.writeErrors && writeResult.writeErrors.length > 0) {
                console.error('Bulk write errors:', JSON.stringify(writeResult.writeErrors, null, 2));
                // Log first few errors for debugging
                writeResult.writeErrors.slice(0, 3).forEach(err => {
                  console.error(`Write error at index ${err.index}:`, err.errmsg);
                });
                // Collect errors for response
                writeErrors.push(...writeResult.writeErrors.map(err => ({
                  index: err.index,
                  code: err.code,
                  message: err.errmsg
                })));
              }
              
              totalInserted += writeResult.insertedCount || 0;
              totalModified += writeResult.modifiedCount || 0;
              totalUpserts += writeResult.upsertedCount || 0;
            } catch (bulkError) {
              console.error('Bulk write exception:', bulkError);
              // Try to insert one item individually to see the validation error
              if (bulkOps.length > 0 && bulkOps[0].insertOne) {
                try {
                  const testDoc = bulkOps[0].insertOne.document;
                  console.log('Attempting to insert test document:', JSON.stringify(testDoc, null, 2));
                  const testItem = new ShoppingItem(testDoc);
                  await testItem.validate();
                  await testItem.save();
                  console.log('Test insert succeeded!');
                } catch (validationError) {
                  console.error('Validation error on test document:', validationError.message);
                  console.error('Validation errors:', validationError.errors);
                }
              }
              throw bulkError;
            }
          }
        }
        
        console.log('Updating category structure...');
        
        // Get all affected shopping items with their ObjectIds
        const allItemIds = Array.from(categoryUpdates.values())
          .flatMap(cat => cat.itemIds);
        const shoppingItems = await ShoppingItem.find({ id: { $in: allItemIds } });
        const itemIdToObjectId = new Map(shoppingItems.map(item => [item.id, item._id]));
        
        // Batch update categories
        const categoryBulkOps = [];
        
        // Get all existing categories first
        const existingCategories = await Category.find({});
        const categoryMap = new Map(existingCategories.map(cat => [cat.main_category, cat]));
        
        for (const [categoryKey, categoryData] of categoryUpdates) {
          const { main_category, sub_category, item_category, itemIds } = categoryData;
          const objectIds = itemIds.map(id => itemIdToObjectId.get(id)).filter(Boolean);
          
          if (objectIds.length === 0) continue;
          
          let existingCategory = categoryMap.get(main_category);
          
          if (!existingCategory) {
            // Create new category
            categoryBulkOps.push({
              insertOne: {
                document: {
                  main_category,
                  sub_categories: [{
                    sub_category,
                    item_categories: [{
                      item_category,
                      items: objectIds
                    }]
                  }]
                }
              }
            });
          } else {
            // Update existing category using aggregation pipeline
            categoryBulkOps.push({
              updateOne: {
                filter: { main_category },
                update: [
                  {
                    $set: {
                      sub_categories: {
                        $cond: {
                          if: {
                            $in: [sub_category, "$sub_categories.sub_category"]
                          },
                          then: {
                            $map: {
                              input: "$sub_categories",
                              as: "subCat",
                              in: {
                                $cond: {
                                  if: { $eq: ["$$subCat.sub_category", sub_category] },
                                  then: {
                                    sub_category: "$$subCat.sub_category",
                                    item_categories: {
                                      $cond: {
                                        if: {
                                          $in: [item_category, "$$subCat.item_categories.item_category"]
                                        },
                                        then: {
                                          $map: {
                                            input: "$$subCat.item_categories",
                                            as: "itemCat",
                                            in: {
                                              $cond: {
                                                if: { $eq: ["$$itemCat.item_category", item_category] },
                                                then: {
                                                  item_category: "$$itemCat.item_category",
                                                  items: {
                                                    $setUnion: ["$$itemCat.items", objectIds]
                                                  }
                                                },
                                                else: "$$itemCat"
                                              }
                                            }
                                          }
                                        },
                                        else: {
                                          $concatArrays: [
                                            "$$subCat.item_categories",
                                            [{ item_category, items: objectIds }]
                                          ]
                                        }
                                      }
                                    }
                                  },
                                  else: "$$subCat"
                                }
                              }
                            }
                          },
                          else: {
                            $concatArrays: [
                              "$sub_categories",
                              [{
                                sub_category,
                                item_categories: [{ item_category, items: objectIds }]
                              }]
                            ]
                          }
                        }
                      }
                    }
                  }
                ],
                upsert: false
              }
            });
          }
        }
        
        // Execute category bulk operations
        if (categoryBulkOps.length > 0) {
          await Category.bulkWrite(categoryBulkOps, { ordered: false });
        }
        
        console.log('Processing completed successfully');
        
        if (results.length > 0) {
          fs.unlinkSync(filePath);
          // Populate shopping item details in subcategories/item_categories
          const populatedCategories = await Category.find()
            .populate("sub_categories.item_categories.items");
          return res.json(new apiresponse(200, {
            processedRows: results.length,
            insertedCount: totalInserted,
            modifiedCount: totalModified,
            upsertedCount: totalUpserts,
            categoriesUpdated: populatedCategories?.length ?? 0,
            writeErrors: writeErrors.length > 0 ? writeErrors.slice(0, 10) : undefined,
            debug: {
              separator: detectedSeparator,
              firstFiveIds,
              totalPlannedInserts,
              totalPlannedUpdates,
              sampleDocument
            }
          }, writeErrors.length > 0 ? `Items processed with ${writeErrors.length} errors` : "Items processed successfully"));
        }
        // Fallback safety: if somehow reached here, send a generic success
        return res.json(new apiresponse(200, "No items to process", "No items to process"));
      } catch (error) {
        console.error('Error processing shopping items:', error);
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
        res.status(500).json(new apierror(500, "Error processing shopping items", [error.message]));
      }
    })
    .on("error", (err) => {
      console.error('Error reading CSV file:', err);
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
      res.status(500).json(new apierror(500, "Error reading the CSV file", [err.message]));
    });
});

// Performance monitoring helper
const logQueryPerformance = (operation, queryTime, itemCount, filters) => {
  const logData = {
    operation,
    queryTime: `${queryTime}ms`,
    itemCount,
    filters,
    timestamp: new Date().toISOString(),
    isSlowQuery: queryTime > 5000 // Flag queries taking more than 5 seconds
  };
  
  if (logData.isSlowQuery) {
    console.warn('🐌 SLOW QUERY DETECTED:', JSON.stringify(logData, null, 2));
  } else {
    console.log('⚡ Query Performance:', JSON.stringify(logData, null, 2));
  }
  
  return logData;
};

export const getshoppingitems = asynchandler(async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(req.query);
    
    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      const totalTime = Date.now() - requestStartTime;
      logQueryPerformance('cache_hit', totalTime, cachedResult.totalItems || cachedResult.items?.length, req.query);
      return res.json(new apiresponse(200, cachedResult, "Shopping items fetched successfully (cached)"));
    }
    
    // Build filter object
    const filter = {};
    if (req.query.main_category) filter.main_category = req.query.main_category.toLowerCase();
    if (req.query.sub_category) filter.sub_category = req.query.sub_category.toLowerCase();
    if (req.query.item_category) filter.item_category = req.query.item_category.toLowerCase();
    if (req.query.brand) filter.brand = new RegExp(req.query.brand, 'i');
    if (req.query.min_price) filter.discountprice = { $gte: parseFloat(req.query.min_price) };
    if (req.query.max_price) {
      filter.discountprice = filter.discountprice || {};
      filter.discountprice.$lte = parseFloat(req.query.max_price);
    }
    
    // Search functionality using text index
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Select only necessary fields to reduce data transfer
    const selectedFields = 'id main_category sub_category item_category itemfullname brand discountprice orignalprice imgsrc quantity loyaltypoints';
    
    // Check if user wants paginated results (when page or limit is specified)
    // Otherwise, return all items by default
    const wantsPagination = req.query.page || req.query.limit;
    
    if (!wantsPagination && req.query.all !== 'false') {
      // Return all items - sort in memory to avoid MongoDB hint issues with views
      const startTime = Date.now();
      const items = await ShoppingItem.find(filter)
        .select('id main_category sub_category item_category itemfullname brand discountprice orignalprice imgsrc quantity loyaltypoints')
        .lean()
        .maxTimeMS(30000);
      
      // Sort in memory to avoid hint errors
      const sortedItems = items.sort((a, b) => (b.id || 0) - (a.id || 0));
      
      const queryTime = Date.now() - startTime;
      const totalTime = Date.now() - requestStartTime;
      
      // Remove _id from results to match expected format
      const itemsWithoutId = sortedItems.map(item => {
        const { _id, ...rest } = item;
        return rest;
      });
      
      const result = {
        items: itemsWithoutId,
        totalItems: itemsWithoutId.length,
        queryTime: `${queryTime}ms`
      };
      
      // Log performance
      logQueryPerformance('find_all_items', totalTime, itemsWithoutId.length, req.query);
      
      // Cache the result
      setCachedData(cacheKey, result);
      
      return res.json(new apiresponse(200, result, "All shopping items fetched successfully"));
    }
    
    // Check if streaming is requested for very large datasets
    const useStreaming = req.query.stream === 'true';
    
    if (useStreaming) {
      // Set headers for streaming response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // Use find() instead of aggregate to avoid hint issues
      const pipeline = [
        { $match: filter },
        {
          $project: {
            id: 1,
            main_category: 1,
            sub_category: 1,
            item_category: 1,
            itemfullname: 1,
            brand: 1,
            discountprice: 1,
            orignalprice: 1,
            imgsrc: 1,
            quantity: 1,
            loyaltypoints: 1,
            _id: 0
          }
        }
        // Removed $sort to avoid hint errors - will sort in memory if needed
      ];
      
      if (req.query.search) {
        pipeline.splice(1, 0, { $addFields: { score: { $meta: "textScore" } } });
      }
      
      const startTime = Date.now();
      let itemCount = 0;
      const allItems = [];
      
      // Start streaming response
      res.write('{"statusCode":200,"data":{"items":[');
      
      try {
        const cursor = ShoppingItem.aggregate(pipeline).allowDiskUse(true).cursor({ batchSize: 1000 });
        
        for await (const item of cursor) {
          allItems.push(item);
        }
        
        // Sort in memory to avoid hint errors
        const sortedItems = allItems.sort((a, b) => {
          if (req.query.search && a.score !== undefined && b.score !== undefined) {
            return b.score - a.score; // Sort by text score if available
          }
          return (b.id || 0) - (a.id || 0); // Otherwise sort by id
        });
        
        let isFirst = true;
        for (const item of sortedItems) {
          if (!isFirst) res.write(',');
          res.write(JSON.stringify(item));
          isFirst = false;
          itemCount++;
          
          // Flush every 100 items for better streaming
          if (itemCount % 100 === 0) {
            res.flush && res.flush();
          }
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // If aggregation fails, fall back to find()
        const items = await ShoppingItem.find(filter)
          .select('id main_category sub_category item_category itemfullname brand discountprice orignalprice imgsrc quantity loyaltypoints')
          .lean();
        
        const sortedItems = items.sort((a, b) => (b.id || 0) - (a.id || 0));
        const itemsWithoutId = sortedItems.map(item => {
          const { _id, ...rest } = item;
          return rest;
        });
        
        let isFirst = true;
        for (const item of itemsWithoutId) {
          if (!isFirst) res.write(',');
          res.write(JSON.stringify(item));
          isFirst = false;
          itemCount++;
        }
      }
      
      const queryTime = Date.now() - startTime;
       const totalTime = Date.now() - requestStartTime;
       res.write(`],"totalItems":${itemCount},"queryTime":"${queryTime}ms"},"message":"All shopping items streamed successfully"}`);
       res.end();
       
       // Log performance
       logQueryPerformance('streaming_query', totalTime, itemCount, req.query);
       return;
    }
    
    // Return paginated response when explicitly requested
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default limit when pagination is requested
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel for better performance
    // Note: We fetch all items and sort in memory to avoid hint errors with MongoDB views
    const queryStartTime = Date.now();
    const [allItems, totalCount] = await Promise.all([
      ShoppingItem.find(filter)
        .select(selectedFields)
        .lean() // Use lean for better performance
        .maxTimeMS(5000), // 5 second timeout for fast response
      ShoppingItem.countDocuments(filter).maxTimeMS(3000) // 3 second timeout for count
    ]);
    
    // Sort in memory to avoid hint errors, then paginate
    const sortedItems = allItems.sort((a, b) => (b.id || 0) - (a.id || 0));
    const items = sortedItems.slice(skip, skip + limit);
    const queryTime = Date.now() - queryStartTime;
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const result = {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      queryTime: `${queryTime}ms`
    };
    
    // Log performance
    const totalTime = Date.now() - requestStartTime;
    logQueryPerformance('paginated_query', totalTime, items.length, { ...req.query, totalCount });
    
    // Cache the result
    setCachedData(cacheKey, result);
    
    return res.json(new apiresponse(200, result, "Shopping items fetched successfully"));
    
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    return res.json(new apierror(500, "Error fetching shopping items", error.message));
  }
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
    .findOne({ id: Number(id) })
     
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

 