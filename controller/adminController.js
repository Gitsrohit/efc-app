import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
// const { uploadToBackblaze } = require('../middlewares/multerBackblaze.js');
// import { uploadToBackblaze } from '../middlewares/multerBackblaze.js';
// import { uploadToBackblaze, uploadFileToBackblaze } from '../middlewares/multerBackblaze.js';
import {uploadFile} from '../middlewares/cloudinary.js';
import {Category} from '../models/adminModel.js';
import {CategoryItem} from '../models/adminModel.js';
// import { Order } from '../models/adminModel.js';
import {Table} from '../models/adminModel.js';
import {KOT} from '../models/adminModel.js';
import {Ad} from '../models/adminModel.js';
import {AdminProfile} from '../models/adminModel.js';
import {Bill} from '../models/adminModel.js';
import {NewBill} from '../models/adminModel.js';
import {OnlineBill} from '../models/adminModel.js';
import {NewFacility} from '../models/adminModel.js';
import {Facility} from '../models/adminModel.js';
import {Customer} from '../models/adminModel.js';
// const onlineOrder = require("../middlewares/kafkaConsumer.js");


// add-category controller
export const addCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        const companyId = req.companyId;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Pass file buffer to Cloudinary uploader
        const imageUrl = await uploadFile(req.file.buffer, 'categories');

        const existingCategory = await Category.findOne({ name, companyId });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const newCategory = await Category.create({
            name,
            companyId,
            image: imageUrl,
        });

        res.status(201).json({
            success: true,
            message: "New category added successfully",
            data: newCategory,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};


// get all category controller
export const getAllCategories = async (req, res) => {
    try {
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'companyId is required' });
        }
        const categories = await Category.find({companyId}); 
        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving categories",
            error: error.message,
        });
    }
};

//edit category controller
export const editCategoryController = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const {name} = req.body; 
        const companyId = req.companyId; 
        const imagePath = req.file ? req.file.path : null; 

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const category = await Category.findOne({ _id: categoryId, companyId });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or access denied",
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (companyId) updateData.companyId = companyId;

        if (imagePath) {
            const imageUrl = await uploadFile(imagePath.buffer, 'categories');
            updateData.image = imageUrl;
        }
        // if (imagePath) updateData.image = imagePath;

        console.log("Update Data:", updateData);

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,

            updateData, 
            {new: true} 
        );

        if (!updatedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory,
        });
    } catch (error) {
        console.error("Error updating category:", error.message);
        res.status(500).json({
            success: false,
            message: "Error updating category",
            error: error.message,
        });
    }
};

// delete category controller
export const deleteCategoryController = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const companyId = req.companyId; 

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const category = await Category.findOne({ _id: categoryId, companyId });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you don't have access to delete this category",
            });
        }

        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting category:", error.message);
        res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message,
        });
    }
};

// add category item controller
export const addCategoryItem = async (req, res) => {
    try {
        const { itemName, type, kitchen, price, categoryId, description } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'companyId is required' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check for duplicate items with the same itemName, type, and companyId
        const existingItem = await CategoryItem.findOne({ 
            itemName, 
            type, 
            companyId 
        });

        if (existingItem) {
            return res.status(400).json({
                message: 'An item with the same name and type already exists for this company.',
            });
        }

        let imageUrl = null;

        if (req.file && req.file.buffer) {
            imageUrl = await uploadFile(req.file.buffer, 'categories');
        } else {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const newItem = await CategoryItem.create({
            itemName,
            type,
            kitchen,
            price,
            description,
            image: imageUrl,
            category: categoryId,
            companyId,
        });

        category.items.push(newItem._id);
        await category.save();

        res.status(201).json({ message: 'Menu item added successfully', item: newItem });
    } catch (error) {
        console.error("Error adding menu item:", error.message);
        res.status(500).json({ message: 'Error adding menu item', error: error.message });
    }
};



// get category item controller
// export const getCategoryItems = async (req, res) => {
//     try {
//         const {itemId} = req.query; 

//         const query = itemId ? {category: itemId} : {};
//         const items = await CategoryItem.find(query).populate('category', 'name type');

//         if (items.length === 0) {
//             return res.status(404).json({ message: 'No items found' });
//         }

//         res.status(200).json({ message: 'Category items retrieved successfully', items });
//     } catch (error) {
//         res.status(500).json({ message: 'Error retrieving category items', error: error.message });
//     }
// };
export const getCategoryItems = async (req, res) => {
    try {
        const categoryId  = req.params.id;
        const companyId = req.companyId; 

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID',
            });
        }

        const category = await Category.findById({_id: categoryId, companyId}).populate('items');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category items retrieved successfully',
            data: category.items, 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving category items',
            error: error.message,
        });
    }
};


// edit category item controller
export const editCategoryItemController = async (req, res) => {
    try {
        const itemId = req.params.id; 
        const {itemName, price, description, categoryId,type} = req.body;
        const companyId = req.companyId;  
        const imagePath = req.file ? req.file.path : null; 

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const categoryItem = await CategoryItem.findOne({ _id: itemId, companyId });
        if (!categoryItem) {
            return res.status(404).json({
                success: false,
                message: "Category item not found or you don't have access to edit this item",
            });
        }

        const updateData = {};
        if (itemName) updateData.itemName = itemName;
        if (price) updateData.price = price;
        if (description) updateData.description = description;
        if (imagePath) {
            const imageUrl = await uploadFile(imagePath.buffer, 'categories');
            updateData.image = imageUrl;
        }
        // if (imagePath) updateData.image = imagePath;
        if (categoryId) updateData.category = categoryId;
        if (type) updateData.type = type;
        if (companyId) updateData.companyId = companyId;

        console.log("Update Data:", updateData);

        const updatedItem = await CategoryItem.findByIdAndUpdate(
            itemId, 
            updateData, 
            {new: true}
        );

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: "Category item not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category item updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        console.error("Error updating category item:", error.message);
        res.status(500).json({
            success: false,
            message: "Error updating category item",
            error: error.message,
        });
    }
};

// delete category item controller
export const deleteCategoryItemController = async (req, res) => {
    try {
        const itemId = req.params.id;
        const companyId = req.companyId; 

        // const categoryItem = await CategoryItem.findById(itemId);
        // if (!categoryItem) {
        //     return res.status(404).json({
        //         success: false,
        //         message: "Category item not found",
        //     });
        // }

        // const categoryId = categoryItem.category;
        // await Category.findByIdAndUpdate(
        //     categoryId,
        //     {$pull: {items: itemId}},
        //     {new: true}
        // );

        // await CategoryItem.findByIdAndDelete(itemId);

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const categoryItem = await CategoryItem.findOne({ _id: itemId, companyId });
        if (!categoryItem) {
            return res.status(404).json({
                success: false,
                message: "Category item not found or you don't have access to delete this item",
            });
        }

        const categoryId = categoryItem.category;
        await Category.findByIdAndUpdate(categoryId, { $pull: { items: itemId } }, { new: true });
        await CategoryItem.findByIdAndDelete(itemId);
        
        res.status(200).json({
            success: true,
            message: "Category item deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting category item:", error.message);
        res.status(500).json({
            success: false,
            message: "Error deleting category item",
            error: error.message,
        });
    }
};

//add stocks to each item
export const addStockController = async (req, res) => {
    try {
        const {itemId, stockToAdd} = req.body;

        if (!itemId || stockToAdd === undefined) {
            return res.status(400).json({ message: "Item ID and stock quantity are required" });
        }

        const item = await CategoryItem.findById(itemId);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        item.stock += stockToAdd; 
        await item.save();

        res.status(200).json({
            message: "Stock updated successfully",
            data: { itemName: item.itemName, stock: item.stock },
        });
    } catch (error) {
        console.error("Error updating stock:", error.message);
        res.status(500).json({ message: "Error updating stock", error: error.message });
    }
};


// add table controller
export const addTableController = async (req, res) => {
    try {
        const {name} = req.body;
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const existingTable = await Table.findOne({name});
        if (existingTable) {
            return res.status(400).json({success: false, message: "Table already exists"});
        }

        const newTable = await Table.create({name,companyId});

        res.status(201).json({ success: true, message: "Table added successfully", data: newTable });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding table", error: error.message });
    }
};

//get table controller
export const getAllTables = async (req, res) => {
    try {
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const tables = await Table.find({companyId: companyId}).populate('menuItems.item', 'itemName price');

        if (tables.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No tables found for this company",
            });
        }
        res.status(200).json({
            success: true,
            message: "Tables fetched successfully",
            data: tables,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching tables",
            error: error.message,
        });
    }
};


// delete table controller
export const deleteTableController = async (req, res) => {
    try {
        const tableId = req.params.id; 
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        if (table.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this table",
            });
        }

        const deletedTable = await Table.findByIdAndDelete(tableId);

        if (!deletedTable) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Table deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting table:", error.message);
        res.status(500).json({
            success: false,
            message: "Error deleting table",
            error: error.message,
        });
    }
};

//add menu items to table
export const addMenuItemsToTable = async (req, res) => {
    try {
        const {tableId} = req.params;
        const {items} = req.body; 
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (table.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to add menu items to this table",
            });
        }

        const adminMenuItems = await CategoryItem.find({ companyId });

        for (const {itemId, quantity} of items) {
            const menuItem = adminMenuItems.find(item => item._id.toString() === itemId.toString());
            if (!menuItem) {
                return res.status(404).json({ success: false, message: `Menu item not found or not part of your menu: ${itemId}` });
            }

            const existingItem = table.menuItems.find(
                (menuItem) => menuItem.item.toString() === itemId
            );

            if (existingItem) {
                existingItem.quantity += quantity || 1;
            } else {
                table.menuItems.push({
                    item: itemId,
                    quantity: quantity || 1,
                    price: menuItem.price,
                });
            }
        }

        table.reserved = true;
        await table.save();

        res.status(200).json({
            success: true,
            message: "Menu items added to the table successfully",
            data: table,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error adding menu items to table",
            error: error.message,
        });
    }
};

// add Advertisement to the template
export const addAdController = async (req, res) => {
    try {
        const {name, description} = req.body;
        const imagePath = req.file ? req.file.path : null;
        const companyId = req.companyId; 

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: foodItemName, description",
            });
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const imageUrl = await uploadFile(imagePath.buffer, 'categories');

        const newAd = await Ad.create({
            name,
            description,
            companyId,
            image:imageUrl,
        });

        res.status(201).json({
            success: true,
            message: "Ad created successfully",
            data: newAd,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating ad",
            error: error.message,
        });
    }
};

// get active ads controller
export const getActiveAdsController = async (req, res) => {
    try {
        const companyId = req.companyId; 

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const ads = await Ad.find({isActive: true,companyId});

        res.status(200).json({
            success: true,
            message: "Active ads fetched successfully",
            data: ads,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching ads",
            error: error.message,
        });
    }
};

// deactivate ads 
export const deactivateAdController = async (req, res) => {
    try {
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }
        const {adId} = req.params;
        const ad = await Ad.findOne({ _id: adId, companyId });

        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        ad.isActive = false;
        await ad.save();

        res.status(200).json({
            success: true,
            message: "Ad deactivated successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deactivating ad",
            error: error.message,
        });
    }
};

// export const generateKOTController = async (req, res) => {
//     try {
//         const { tableId, operatorId } = req.body;
//         const companyId = req.companyId;

//         if (!companyId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "companyId is required",
//             });
//         }

//         const table = await Table.findOne({ _id: tableId, companyId }).populate(
//             "menuItems.item",
//             "_id itemName price kitchen"
//         );

//         if (!table) {
//             return res.status(404).json({ success: false, message: "Table not found" });
//         }

//         const newItems = table.menuItems.filter((menuItem) => {
//             const existingGeneratedItem = table.kotGeneratedItems.find(
//                 (kotItem) => kotItem.item.toString() === menuItem.item._id.toString()
//             );

//             if (existingGeneratedItem) {
//                 if (menuItem.quantity > existingGeneratedItem.quantity) {
//                     menuItem.quantity -= existingGeneratedItem.quantity;
//                     return true;
//                 } else {
//                     return false;
//                 }
//             }
//             return true; 
//         });

//         if (newItems.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No new items to generate KOT for",
//             });
//         }

//         const itemsByKitchen = newItems.reduce((acc, menuItem) => {
//             const kitchen = menuItem.item.kitchen;
//             if (!acc[kitchen]) acc[kitchen] = [];
//             acc[kitchen].push({
//                 itemName: menuItem.item.itemName,
//                 quantity: menuItem.quantity,
//                 price: menuItem.item.price,
//                 itemId: menuItem.item._id,
//             });
//             return acc;
//         }, {});

//         const generatedKOTs = [];

//         for (const kitchen in itemsByKitchen) {
//             const items = itemsByKitchen[kitchen];

//             const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

//             const kot = await KOT.create({
//                 ticketNumber,
//                 tableName: table.name,
//                 operatorId,
//                 companyId,
//                 items: items.map((item) => ({
//                     itemName: item.itemName,
//                     quantity: item.quantity,
//                     price: item.price,
//                 })),
//             });

//             items.forEach((item) => {
//                 const existingGeneratedItem = table.kotGeneratedItems.find(
//                     (kotItem) => kotItem.item.toString() === item.itemId.toString()
//                 );

//                 if (existingGeneratedItem) {
//                     existingGeneratedItem.quantity += item.quantity;
//                 } else {
//                     table.kotGeneratedItems.push({
//                         item: item.itemId,
//                         quantity: item.quantity,
//                     });
//                 }
//             });

//             generatedKOTs.push(kot);
//         }

//         await table.save();

//         res.status(201).json({
//             success: true,
//             message: "KOTs generated successfully",
//             data: generatedKOTs,
//         });
//     } catch (error) {
//         console.error("Error generating KOT:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error generating KOT",
//             error: error.message,
//         });
//     }
// };//this is the only version


// export const generateKOTController = async (req, res) => {
//     try {
//         const { tableId, operatorId, items } = req.body;
//         const companyId = req.companyId;
//         console.log("companyId",companyId);

//         if (!companyId) {
//             return res.status(400).json({ success: false, message: "companyId is required" });
//         }

//         // const table = await Table.findById(tableId).select("+companyId");
//         // console.log("Fetched Table with companyId:", table);


//         let table = await Table.findById(tableId);
//         console.log("fetched table:",table)

//         if (!table) {
//             return res.status(404).json({ success: false, message: "Table not found" });
//         }
//         console.log("Table company Id:",table.companyId)

//         //Iss part ko review karna hoga 

//         if (table.companyId.toString() !== companyId.toString()) {
//             return res.status(403).json({ success: false, message: "Unauthorized" });
//         }

//         // Reserve the table if it's the first KOT
//         if (!table.reserved) {
//             table.reserved = true;
//         }

//         // Validate and group menu items by kitchen
//         const adminMenuItems = await CategoryItem.find({ companyId });
//         const itemsByKitchen = {};

//         for (const { itemId, quantity } of items) {
//             const menuItem = adminMenuItems.find((menu) => menu.id === itemId);

//             if (!menuItem) {
//                 return res.status(404).json({ success: false, message: `Menu item not found: ${itemId}` });
//             }

//             const itemData = {
//                 itemName: menuItem.itemName,
//                 quantity: quantity || 1,
//                 price: menuItem.price,
//             };

//             if (!itemsByKitchen[menuItem.kitchen]) {
//                 itemsByKitchen[menuItem.kitchen] = [];
//             }

//             itemsByKitchen[menuItem.kitchen].push(itemData);
//         }

//         const generatedKOTs = [];

//         for (const kitchen in itemsByKitchen) {
//             const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

//             const kot = await KOT.create({
//                 ticketNumber,
//                 tableName: table.name,
//                 operatorId,
//                 companyId,
//                 items: itemsByKitchen[kitchen],
//             });

//             generatedKOTs.push(kot);
//         }

//         await table.save();

//         res.status(201).json({
//             success: true,
//             message: "KOTs generated successfully",
//             data: generatedKOTs,
//         });
//     } catch (error) {
//         console.error("Error generating KOT:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error generating KOT",
//             error: error.message,
//         });
//     }
// }; //original wala if something went wrong isko chalu kardo

export const generateKOTController = async (req, res) => {
    try {
        const { tableId, operatorId, items } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        let table = await Table.findById(tableId).populate({
            path: "kotGeneratedItems",
            select: "ticketNumber items createdAt", 
        });

        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (table.companyId?.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (!table.reserved) {
            table.reserved = true;
        }

        const adminMenuItems = await CategoryItem.find({ companyId });
        const itemsByKitchen = {};

        for (const { itemId, quantity } of items) {
            const menuItem = adminMenuItems.find((menu) => menu.id === itemId);

            if (!menuItem) {
                return res.status(404).json({ success: false, message: `Menu item not found: ${itemId}` });
            }

            const itemData = {
                itemId,
                itemName: menuItem.itemName,
                quantity: quantity || 1,
                price: menuItem.price,
            };

            if (!itemsByKitchen[menuItem.kitchen]) {
                itemsByKitchen[menuItem.kitchen] = [];
            }

            itemsByKitchen[menuItem.kitchen].push(itemData);
        }

        const generatedKOTs = [];

        for (const kitchen in itemsByKitchen) {
            const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

            const kot = await KOT.create({
                ticketNumber,
                tableName: table.name,
                operatorId,
                companyId,
                items: itemsByKitchen[kitchen],
            });

            generatedKOTs.push(kot);
        }

        table.kotGeneratedItems = [...(table.kotGeneratedItems || []), ...generatedKOTs.map(kot => kot._id)];

        await table.save();

        
        const updatedTable = await Table.findById(tableId).populate({
            path: "kotGeneratedItems",
            select: "ticketNumber items createdAt",
        });

        res.status(201).json({
            success: true,
            message: "KOTs generated successfully",
            data: {
                generatedKOTs,
                previousKOTs: updatedTable.kotGeneratedItems, // ✅ Now includes KOT details
            },
        });
    } catch (error) {
        console.error("Error generating KOT:", error.message);
        res.status(500).json({
            success: false,
            message: "Error generating KOT",
            error: error.message,
        });
    }
}; //modified wala 

export const showBillController = async (req, res) => {
    try {
        const { tableId } = req.params;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required" });
        }

        const table = await Table.findById(tableId).populate({
            path: "kotGeneratedItems",
            select: "ticketNumber items createdAt",
        });

        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (table.companyId?.toString() !== companyId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const itemMap = new Map(); // { itemName -> { quantity, price } }

        table.kotGeneratedItems.forEach((kot) => {
            kot.items.forEach((item) => {
                if (itemMap.has(item.itemName)) {
                    itemMap.get(item.itemName).quantity += item.quantity;
                } else {
                    itemMap.set(item.itemName, {
                        quantity: item.quantity,
                        price: item.price,
                    });
                }
            });
        });

        const orderedItems = Array.from(itemMap, ([itemName, data]) => ({
            itemName,
            quantity: data.quantity,
            price: data.price,
            totalPrice: data.quantity * data.price,
        }));

        const totalBill = orderedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        res.status(200).json({
            success: true,
            message: "Bill details fetched successfully",
            data: {
                tableName: table.name,
                orderedItems,
                totalBill,
            },
        });
    } catch (error) {
        console.error("Error fetching bill:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching bill",
            error: error.message,
        });
    }
};


// generate online kot
export const generateOnlineKOTController = async (req, res) => {
  try {
    const { orderId, operatorId, items } = req.body;
    const companyId = req.companyId;

    if (!orderId || !operatorId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "orderId, operatorId, and items are required",
      });
    }

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    const adminMenuItems = await CategoryItem.find({ companyId });
    const itemsByKitchen = {};

    for (const { itemId, quantity } of items) {
      const menuItem = adminMenuItems.find((menu) => menu.id === itemId);

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${itemId}`,
        });
      }

      const itemData = {
        itemName: menuItem.itemName,
        quantity: quantity || 1,
        price: menuItem.price,
      };

      if (!itemsByKitchen[menuItem.kitchen]) {
        itemsByKitchen[menuItem.kitchen] = [];
      }

      itemsByKitchen[menuItem.kitchen].push(itemData);
    }

    const generatedKOTs = [];

    for (const kitchen in itemsByKitchen) {
      const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

      const kot = await KOT.create({
        ticketNumber,
        orderId,
        operatorId,
        companyId,
        items: itemsByKitchen[kitchen],
      });

      generatedKOTs.push(kot);
    }

    res.status(201).json({
      success: true,
      message: "KOTs generated successfully for online order",
      data: generatedKOTs,
    });
  } catch (error) {
    console.error("Error generating KOT for online order:", error.message);
    res.status(500).json({
      success: false,
      message: "Error generating KOT for online order",
      error: error.message,
    });
  }
};

// export const generateBillController = async (req, res) => {
//     try {
//       const { tableId, paymentMode } = req.body;
//       const companyId = req.companyId;
  
//       if (!companyId) {
//         return res.status(400).json({ success: false, message: "companyId is required" });
//       }
  
//       const table = await Table.findById(tableId);
//       if (!table) {
//         return res.status(404).json({ success: false, message: "Table not found" });
//       }
  
//       if (!table.reserved) {
//         return res.status(400).json({ success: false, message: "Table is not reserved" });
//       }
  
//       // Fetch all KOTs for the table (don't include previous bill KOTs)
//       const kots = await KOT.find({ tableName: table.name, companyId });
  
//       if (!kots.length) {
//         return res.status(400).json({ success: false, message: "No KOTs found for this table" });
//       }
  
//       // Generate unique bill number
//       const billNumber = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;
//       const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  
//       let totalAmount = 0;
//       const consolidatedItems = [];
  
//       // Consolidate all items from KOTs
//       kots.forEach(kot => {
//         kot.items.forEach(item => {
//           const existingItem = consolidatedItems.find(i => i.itemName === item.itemName);
//           if (existingItem) {
//             existingItem.quantity += item.quantity;
//           } else {
//             consolidatedItems.push({ ...item });
//           }
//           totalAmount += item.price * item.quantity;
//         });
//       });
  
//       // Create and save the bill
//       const bill = await Bill.create({
//         billNumber,
//         orderNumber,
//         billDate: new Date(),
//         tableName: table.name,
//         companyId,
//         operatorId: kots[0].operatorId,
//         kotNumbers: kots.map(kot => kot.ticketNumber),
//         items: consolidatedItems,
//         totalAmount,
//         paymentMode,
//       });
  
//       // Unreserve the table and clear KOTs for that table
//       table.reserved = false;
//       table.kotGeneratedItems = []; // Clear KOTs after bill is generated
//       await table.save();
  
//       // Respond with the bill details
//       res.status(201).json({
//         success: true,
//         message: "Bill generated successfully",
//         data: bill,
//       });
//     } catch (error) {
//       console.error("Error generating bill:", error);
//       res.status(500).json({
//         success: false,
//         message: "Error generating bill",
//         error: error.message,
//       });
//     }
//   };  bill generate ka previous right controller agar kuch galat hua isko on kar dena

export const generateBillController = async (req, res) => {
    try {
        const { tableId, paymentMode } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        const table = await Table.findById(tableId).populate("kotGeneratedItems");
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (!table.reserved) {
            return res.status(400).json({ success: false, message: "Table is not reserved" });
        }

        if (!table.kotGeneratedItems || table.kotGeneratedItems.length === 0) {
            return res.status(400).json({ success: false, message: "No KOTs found for this table" });
        }

        let totalAmount = 0;
        const itemMap = new Map(); 

        table.kotGeneratedItems.forEach(kot => {
            if (!kot.items || kot.items.length === 0) return; 

            kot.items.forEach(item => {
                if (itemMap.has(item.itemName)) {
                    
                    itemMap.get(item.itemName).quantity += item.quantity;
                } else {
                    
                    itemMap.set(item.itemName, {
                        quantity: item.quantity,
                        price: item.price,
                    });
                }
            });
        });

        const consolidatedItems = Array.from(itemMap, ([itemName, data]) => ({
            itemName,
            quantity: data.quantity,
            price: data.price,
            totalPrice: data.quantity * data.price,
        }));

        if (consolidatedItems.length === 0) {
            return res.status(400).json({ success: false, message: "No valid items found for billing" });
        }

        totalAmount = consolidatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const billNumber = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;
        const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        const bill = await Bill.create({
            billNumber,
            orderNumber,
            billDate: new Date(),
            tableName: table.name,
            companyId,
            operatorId: table.kotGeneratedItems[0]?.operatorId || "Unknown",
            kotNumbers: table.kotGeneratedItems.map(kot => kot.ticketNumber),
            items: consolidatedItems,
            totalAmount,
            paymentMode,
        });

        table.reserved = false;
        table.kotGeneratedItems = []; 
        table.menuItems = []; 
        await table.save();

        res.status(201).json({
            success: true,
            message: "Bill generated successfully",
            data: bill,
        });

    } catch (error) {
        console.error("Error generating bill:", error);
        res.status(500).json({
            success: false,
            message: "Error generating bill",
            error: error.message,
        });
    }
};

//generate revenue by date controller
export const getRevenueByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const companyId = req.companyId; // Ensure company-specific filtering

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Start date and end date are required" });
        }

        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        // Convert dates to UTC for accurate filtering
        const start = new Date(`${startDate}T00:00:00.000Z`);
        const end = new Date(`${endDate}T23:59:59.999Z`);

        console.log("Start Date in UTC:", start);
        console.log("End Date in UTC:", end);

        // Fetch bills within the date range for the specific company
        const revenueData = await Bill.find({
            companyId,
            billDate: { $gte: start, $lte: end }
        });

        console.log("Fetched Revenue Data:", revenueData);

        if (revenueData.length === 0) {
            return res.status(200).json({ success: true, message: "No revenue data found", data: [] });
        }

        // Calculate total revenue
        const totalRevenue = revenueData.reduce((sum, bill) => sum + bill.totalAmount, 0);

        res.status(200).json({
            success: true,
            message: "Revenue data fetched successfully",
            totalRevenue,
            data: revenueData,
        });

    } catch (error) {
        console.error("Error fetching revenue data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching revenue data",
            error: error.message,
        });
    }
};

export const getReducedRevenueByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const companyId = req.companyId; // Ensure company-specific filtering

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Start date and end date are required" });
        }

        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        // Convert dates to UTC for accurate filtering
        const start = new Date(`${startDate}T00:00:00.000Z`);
        const end = new Date(`${endDate}T23:59:59.999Z`);

        console.log("Start Date in UTC:", start);
        console.log("End Date in UTC:", end);

        // Fetch bills within the date range for the specific company
        const revenueData = await Bill.find({
            companyId,
            billDate: { $gte: start, $lte: end }
        });

        console.log("Fetched Revenue Data:", revenueData);

        if (revenueData.length === 0) {
            return res.status(200).json({ success: true, message: "No revenue data found", data: [] });
        }

        // Calculate total revenue by taking only 10% of each bill's totalAmount
        const discountedRevenue = revenueData.reduce((sum, bill) => sum + (bill.totalAmount * 0.1), 0);

        res.status(200).json({
            success: true,
            message: "Discounted revenue data fetched successfully",
            totalDiscountedRevenue: discountedRevenue.toFixed(2), // Keep only 2 decimal places
            data: revenueData,
        });

    } catch (error) {
        console.error("Error fetching revenue data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching revenue data",
            error: error.message,
        });
    }
};






//create bill for onlin order
// export const generateOnlineBillController = async (req, res) => {
//     try {
//       const { name, id: orderId, operator, items, paymentMode } = req.body;
//       const companyId = req.companyId;
  
//       // Validate request payload
//       if (!orderId || !operator || !items || !items.length) {
//         return res.status(400).json({
//           success: false,
//           message: "Order ID, operator, and items are required.",
//         });
//       }
  
//       if (!companyId) {
//         return res.status(400).json({ success: false, message: "Company ID is required." });
//       }
  
//       // Calculate total amount
//       let totalAmount = 0;
//       items.forEach(item => {
//         totalAmount += item.price * item.quantity;
//       });
  
//       // Generate unique bill number
//       const billNumber = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;
  
//       // Create and save the bill
//       const bill = await OnlineBill.create({
//         billNumber,
//         orderId,
//         billDate: new Date(),
//         customerName: name,
//         companyId,
//         operatorId: operator,
//         items,
//         totalAmount,
//         paymentMode: paymentMode || "Online Payment",
//       });
  
//       res.status(201).json({
//         success: true,
//         message: "Bill generated successfully for online order.",
//         data: bill,
//       });
//     } catch (error) {
//       console.error("Error generating online bill:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Error generating online bill.",
//         error: error.message,
//       });
//     }
//   };

export const generateOnlineBillController = async (req, res) => {
    try {
        const { name, id: orderId, operator, items, paymentMode } = req.body;
        const companyId = req.companyId;

        // Validate request payload
        if (!orderId || !operator || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: "Order ID, operator, and items are required.",
            });
        }

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required." });
        }

        // Fetch menu items from the database based on IDs
        const itemIds = items.map(item => item.menuItemId);
        const menuItems = await CategoryItem.find({ _id: { $in: itemIds }, companyId });

        if (menuItems.length !== itemIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more menu items were not found in the company’s menu.",
            });
        }

        let totalAmount = 0;
        const billItems = [];

        // Calculate total and format items for the bill
        items.forEach(orderItem => {
            const menuItem = menuItems.find(item => item._id.toString() === orderItem.menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${orderItem.menuItemId}`,
                });
            }

            const quantity = orderItem.quantity || 1;
            const price = menuItem.price;
            const itemTotal = price * quantity;
            totalAmount += itemTotal;

            billItems.push({
                itemName: menuItem.itemName,  // Fetching item name from DB
                price, // Fetching price from DB
                quantity,
                total: itemTotal
            });
        });

        // Generate unique bill number
        const billNumber = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;

        // Create and save the bill
        const bill = await OnlineBill.create({
            billNumber,
            orderId,
            billDate: new Date(),
            customerName: name,
            companyId,
            operatorId: operator,
            items: billItems,
            totalAmount,
            paymentMode: paymentMode || "Online Payment",
        });

        // Construct response without `_id`
        const responseData = {
            billNumber: bill.billNumber,
            orderId: bill.orderId,
            billDate: bill.billDate,
            customerName: bill.customerName,
            companyId: bill.companyId,
            operatorId: bill.operatorId,
            items: bill.items,
            totalAmount: bill.totalAmount,
            paymentMode: bill.paymentMode
        };

        res.status(201).json({
            success: true,
            message: "Bill generated successfully for online order.",
            data: responseData,
        });
    } catch (error) {
        console.error("Error generating online bill:", error.message);
        res.status(500).json({
            success: false,
            message: "Error generating online bill.",
            error: error.message,
        });
    }
}; 



// generate new bill 
// export const generateNewBillController = async (req, res) => {
//     try {
//         const { tableId, operatorId } = req.body;
//         const companyId = req.companyId;

//         if (!companyId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "companyId is required",
//             });
//         }

//         const table = await Table.findOne({ _id: tableId, companyId }).populate(
//             "kotGeneratedItems.item",
//             "itemName price"
//         );

//         if (!table) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Table not found",
//             })
//         }

//         const kots = await KOT.find({ tableName: table.name, companyId });

//         if (!kots || kots.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No KOTs found for this table.",
//             });
//         }

//         let totalAmount = 0;
//         const billItems = [];

//         kots.forEach((kot) => {
//             kot.items.forEach((item) => {
//                 const rate = item.price;
//                 const amount = item.quantity * rate * 0.1; 

//                 billItems.push({
//                     itemName: item.itemName,
//                     quantity: item.quantity,
//                     rate: rate,
//                     amount: amount,
//                 });

//                 totalAmount += amount;
//             });
//         });

//         const tenPercentBill = {
//             tableName: table.name,
//             items: billItems,
//             totalAmount,
//             operatorId,
//             companyId,
//             generatedAt: new Date(),
//         };

//         const savedTenPercentBill = await NewBill.create(tenPercentBill);

//         res.status(201).json({
//             success: true,
//             message: "10% Bill generated successfully",
//             data: savedTenPercentBill,
//         });
//     } catch (error) {
//         console.error("Error generating 10% bill:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error generating 10% bill",
//             error: error.message,
//         });
//     }
// };

export const generateNewBillController = async (req, res) => {
    try {
        const { tableId, operatorId, paymentMode } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        if (!paymentMode || !["cash", "card", "upi"].includes(paymentMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing payment method. Accepted values: cash, card, upi",
            });
        }

        const table = await Table.findOne({ _id: tableId, companyId }).populate(
            "kotGeneratedItems.item",
            "itemName price"
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        const kots = await KOT.find({ tableName: table.name, companyId });

        if (!kots || kots.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No KOTs found for this table.",
            });
        }

        let totalAmount = 0;
        const billItems = [];

        kots.forEach((kot) => {
            kot.items.forEach((item) => {
                const rate = item.price;
                const amount = item.quantity * rate * 0.1; 

                billItems.push({
                    itemName: item.itemName,
                    quantity: item.quantity,
                    rate: rate,
                    amount: amount,
                });

                totalAmount += amount;
            });
        });

        const tenPercentBill = {
            tableName: table.name,
            items: billItems,
            totalAmount,
            operatorId,
            companyId,
            paymentMode,
            generatedAt: new Date(),
        };

        const savedTenPercentBill = await NewBill.create(tenPercentBill);

        res.status(201).json({
            success: true,
            message: "10% Bill generated successfully",
            data: savedTenPercentBill,
        });
    } catch (error) {
        console.error("Error generating 10% bill:", error.message);
        res.status(500).json({
            success: false,
            message: "Error generating 10% bill",
            error: error.message,
        });
    }
};



// admin profile apis
export const registerAdminController = async (req, res) => {
    try {
        const {
            restaurantName,
            addressLine1,
            addressLine2,
            state,
            contactNo,
            emailId,
            gstin,
            cin,
            baseCurrency,
            currencyCode,
            ticketFooterMessage,
            startBillNo,
            showLogoInReceipts,
            companyId,
        } = req.body;

        const existingAdmin = await AdminProfile.findOne({ $or: [{ emailId }, { companyId }] });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email or company ID already exists',
            });
        }

        const newAdmin = await AdminProfile.create({
            restaurantName,
            addressLine1,
            addressLine2,
            state,
            contactNo,
            emailId,
            gstin,
            cin,
            baseCurrency,
            currencyCode,
            ticketFooterMessage,
            startBillNo,
            showLogoInReceipts,
            companyId,
        });

        const token = jwt.sign(
            { adminId: newAdmin._id, companyId: newAdmin.companyId },
            process.env.JWT_ADMIN_SECRET,
            { expiresIn: '1000d' }
        );

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            data: {
                restaurantName: newAdmin.restaurantName,
                emailId: newAdmin.emailId,
                companyId: newAdmin.companyId,
            },
        });
    } catch (error) {
        console.error('Error registering admin:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error registering admin',
            error: error.message,
        });
    }
};


export const upsertAdminProfile = async (req, res) => {
  try {
    const {
      restaurantName,
      addressLine1,
      addressLine2,
      state,
      contactNo,
      emailId,
      gstin,
      cin,
      baseCurrency,
      currencyCode,
      ticketFooterMessage,
      startBillNo,
      showLogoInReceipts,
      companyId,
    } = req.body;

    const profileData = {
      restaurantName,
      addressLine1,
      addressLine2,
      state,
      contactNo,
      emailId,
      gstin,
      cin,
      baseCurrency,
      currencyCode,
      ticketFooterMessage,
      startBillNo,
      showLogoInReceipts,
      companyId,
    };

    const profile = await AdminProfile.findOneAndUpdate(
      { companyId },
      profileData,
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    const {companyId} = req.params;

    const profile = await AdminProfile.findOne({ companyId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Facilities section all controllers below

// export const addNewFacility = async (req, res) => {
//     try {
//         const { name, type, capacity, description } = req.body;

//         if (!name || !type || !capacity) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Name, type, and capacity are required.",
//             });
//         }

//         const companyId = req.companyId; 
//         if (!companyId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "companyId is required",
//             });
//         }

//         let pictureUrls = [];

//         // Check if files are uploaded
//         if (req.files && req.files.length > 0) {
//             for (const file of req.files) {
//                 const imageUrl = await uploadFile(file.buffer, "facilities");
//                 pictureUrls.push(imageUrl);
//             }
//         } else {
//             return res.status(400).json({ message: "At least one image file is required" });
//         }

//         // Create a new facility with images
//         const newFacility = await NewFacility.create({
//             name,
//             type,
//             capacity,
//             description,
//             pictureUrls, 
//             companyId,
//         });

//         res.status(201).json({
//             success: true,
//             message: "New facility added successfully.",
//             data: newFacility,
//         });
//     } catch (error) {
//         console.error("Error adding new facility:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error adding new facility.",
//             error: error.message,
//         });
//     }
// };

export const addNewFacility = async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const { name, type, capacity, description ,isBooked = false } = req.body;

        if (!name || !type || !capacity) {
            return res.status(400).json({ success: false, message: "Name, type, and capacity are required." });
        }

        let pictureUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = await uploadFile(file.buffer, "facilities");
                pictureUrls.push(imageUrl);
            }
        } else {
            return res.status(400).json({ message: "At least one image file is required" });
        }

        const newFacility = await Facility.create({
            name,
            type,
            capacity,
            description,
            pictureUrls,
            companyId,  
            isBooked
        });

        res.status(201).json({ success: true, message: "Facility added successfully.", data: newFacility });
    } catch (error) {
        console.error("Error adding facility:", error.message);
        res.status(500).json({ success: false, message: "Error adding facility.", error: error.message });
    }
};

export const getAllFacilities = async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        const facilities = await Facility.find({ companyId }).select("-__v"); // Fetch all fields except version

        res.status(200).json({ success: true, message: "Facilities retrieved successfully.", data: facilities });
    } catch (error) {
        console.error("Error fetching facilities:", error.message);
        res.status(500).json({ success: false, message: "Error fetching facilities.", error: error.message });
    }
};


export const getFacilityById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const facility = await Facility.findOne({ _id: id, companyId });

        if (!facility) {
            return res.status(404).json({ success: false, message: "Facility not found." });
        }

        res.status(200).json({ success: true, message: "Facility retrieved successfully.", data: facility });
    } catch (error) {
        console.error("Error fetching facility:", error.message);
        res.status(500).json({ success: false, message: "Error fetching facility.", error: error.message });
    }
};

export const updateFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        const { name, type, capacity, description, isBooked } = req.body;

        let pictureUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = await uploadFile(file.buffer, "facilities");
                pictureUrls.push(imageUrl);
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (capacity) updateData.capacity = capacity;
        if (description) updateData.description = description;
        if (pictureUrls.length > 0) updateData.pictureUrls = pictureUrls;
        if (isBooked !== undefined) updateData.isBooked = isBooked;  // Update isBooked

        const updatedFacility = await Facility.findOneAndUpdate({ _id: id, companyId }, updateData, { new: true });

        if (!updatedFacility) {
            return res.status(404).json({ success: false, message: "Facility not found." });
        }

        res.status(200).json({ success: true, message: "Facility updated successfully.", data: updatedFacility });
    } catch (error) {
        console.error("Error updating facility:", error.message);
        res.status(500).json({ success: false, message: "Error updating facility.", error: error.message });
    }
};

export const deleteFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required" });
        }

        const deletedFacility = await Facility.findOneAndDelete({ _id: id, companyId });

        if (!deletedFacility) {
            return res.status(404).json({ success: false, message: "Facility not found." });
        }

        res.status(200).json({ success: true, message: "Facility deleted successfully." });
    } catch (error) {
        console.error("Error deleting facility:", error.message);
        res.status(500).json({ success: false, message: "Error deleting facility.", error: error.message });
    }
};

export const bookFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required." });
        }

        const facility = await Facility.findOne({ _id: id, companyId });

        if (!facility) {
            return res.status(404).json({ success: false, message: "Facility not found." });
        }

        if (facility.isBooked === true) {
            return res.status(400).json({ success: false, message: "Facility is already booked." });
        }

        facility.isBooked = true;
        await facility.save();

        res.status(200).json({
            success: true,
            message: "Facility booked successfully.",
            data: facility,
        });
    } catch (error) {
        console.error("Error booking facility:", error.message);
        res.status(500).json({ success: false, message: "Error booking facility.", error: error.message });
    }
};


export const unbookFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID is required." });
        }

        const facility = await Facility.findOne({ _id: id, companyId });

        if (!facility) {
            return res.status(404).json({ success: false, message: "Facility not found." });
        }

        if (facility.isBooked === false) {
            return res.status(400).json({ success: false, message: "Facility is already unbooked." });
        }

        facility.isBooked = false;
        await facility.save();

        res.status(200).json({
            success: true,
            message: "Facility unbooked successfully.",
            data: facility,
        });
    } catch (error) {
        console.error("Error unbooking facility:", error.message);
        res.status(500).json({ success: false, message: "Error unbooking facility.", error: error.message });
    }
};


//adding customer to the database
export const addCustomer = async (req, res) => {
    try {
        const companyId = req.companyId;
        const { name, phoneNumber, positiveBalance = 0, negativeBalance = 0 } = req.body;

        if (!companyId) return res.status(400).json({ success: false, message: "Company ID is required." });
        if (!name || !phoneNumber) return res.status(400).json({ success: false, message: "Name and phone number are required." });

        const existingCustomer = await Customer.findOne({ phoneNumber, companyId });
        if (existingCustomer) return res.status(400).json({ success: false, message: "Customer already exists for this company." });

        const newCustomer = await Customer.create({
            name,
            phoneNumber,
            positiveBalance,
            negativeBalance,
            companyId
        });

        res.status(201).json({ success: true, message: "Customer added successfully.", data: newCustomer });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding customer", error: error.message });
    }
};


// getting all customers
export const getAllCustomers = async (req, res) => {
    try {
        const companyId = req.companyId;

        if (!companyId) return res.status(400).json({ success: false, message: "Company ID is required." });

        const customers = await Customer.find({ companyId });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching customers", error: error.message });
    }
};


//getting customers via phone number
export const getCustomerByPhone = async (req, res) => {
    try {
        const companyId = req.companyId;
        const { phoneNumber } = req.params;

        if (!companyId) return res.status(400).json({ success: false, message: "Company ID is required." });

        const customer = await Customer.findOne({ phoneNumber, companyId });

        if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching customer", error: error.message });
    }
};

//adding and reducing balance
export const updateCustomerBalance = async (req, res) => {
    try {
        const companyId = req.companyId;
        const { phoneNumber } = req.params;
        const { deductAmount = 0, addNegative = 0 } = req.body;

        if (!companyId) return res.status(400).json({ success: false, message: "Company ID is required." });

        const customer = await Customer.findOne({ phoneNumber, companyId });

        if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

        if (deductAmount > 0) {
            if (customer.positiveBalance < deductAmount) {
                return res.status(400).json({ success: false, message: "Insufficient positive balance." });
            }
            customer.positiveBalance -= deductAmount;
        }

        if (addNegative > 0) {
            customer.negativeBalance += addNegative;
        }

        await customer.save();

        res.status(200).json({ success: true, message: "Customer balance updated.", data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating balance", error: error.message });
    }
};

//edit customer
export const updateCustomerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        const { name, phoneNumber } = req.body;

        if (!name || !phoneNumber) {
            return res.status(400).json({ success: false, message: "Name and phone number are required." });
        }

        const customer = await Customer.findOne({ _id: id, companyId });

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found or does not belong to your company." });
        }

        customer.name = name;
        customer.phoneNumber = phoneNumber;

        await customer.save();

        res.status(200).json({ success: true, message: "Customer details updated successfully.", data: customer });

    } catch (error) {
        console.error("Error updating customer details:", error.message);
        res.status(500).json({ success: false, message: "Error updating customer details.", error: error.message });
    }
};














