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

// kot generation for a table
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

//         // Fetch the table with menu items and generated KOTs
//         const table = await Table.findOne({ _id: tableId, companyId }).populate(
//             "menuItems.item",
//             "_id itemName price"
//         );

//         if (!table) {
//             return res.status(404).json({ success: false, message: "Table not found" });
//         }

//         // Filter out items already included in previously generated KOTs
//         const newItems = table.menuItems.filter((menuItem) => {
//             const existingGeneratedItem = table.kotGeneratedItems.find(
//                 (kotItem) => kotItem.item.toString() === menuItem.item._id.toString()
//             );

//             // Exclude items already part of previous KOTs
//             if (existingGeneratedItem) {
//                 // Check if the new quantity is greater than the already generated quantity
//                 if (menuItem.quantity > existingGeneratedItem.quantity) {
//                     // Update the quantity for the remaining items
//                     menuItem.quantity -= existingGeneratedItem.quantity;
//                     return true;
//                 } else {
//                     return false;
//                 }
//             }
//             return true; // Include items not in any previous KOT
//         });

//         // Return error if no new items to generate KOT
//         if (newItems.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No new items to generate KOT for",
//             });
//         }

//         // Generate a ticket number based on whether it is the first or a running KOT
//         const ticketNumber = table.kotGeneratedItems.length === 0 
//             ? `KOT-${Math.floor(10000 + Math.random() * 90000)}`
//             : `RunningKOT-${Math.floor(10000 + Math.random() * 90000)}`;

//         // Create a new KOT document
//         const kot = await KOT.create({
//             ticketNumber,
//             tableName: table.name,
//             operatorId,
//             companyId,
//             items: newItems.map((menuItem) => ({
//                 itemName: menuItem.item.itemName,
//                 quantity: menuItem.quantity,
//                 price: menuItem.item.price,
//             })),
//         });

//         // Update the table's `kotGeneratedItems` to include the newly generated items
//         newItems.forEach((menuItem) => {
//             const existingGeneratedItem = table.kotGeneratedItems.find(
//                 (kotItem) => kotItem.item.toString() === menuItem.item._id.toString()
//             );

//             if (existingGeneratedItem) {
//                 // Increment the quantity for existing items
//                 existingGeneratedItem.quantity += menuItem.quantity;
//             } else {
//                 // Add new items to `kotGeneratedItems`
//                 table.kotGeneratedItems.push({
//                     item: menuItem.item._id,
//                     quantity: menuItem.quantity,
//                 });
//             }
//         });

//         // Save the updated table document
//         await table.save();

//         res.status(201).json({
//             success: true,
//             message: table.kotGeneratedItems.length === 0
//                 ? "Kitchen Order Ticket generated successfully"
//                 : "Running KOT generated successfully",
//             data: kot,
//         });
//     } catch (error) {
//         console.error("Error generating KOT:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error generating KOT",
//             error: error.message,
//         });
//     }
// };

export const generateKOTController = async (req, res) => {
    try {
        const { tableId, operatorId } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        const table = await Table.findOne({ _id: tableId, companyId }).populate(
            "menuItems.item",
            "_id itemName price kitchen"
        );

        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        const newItems = table.menuItems.filter((menuItem) => {
            const existingGeneratedItem = table.kotGeneratedItems.find(
                (kotItem) => kotItem.item.toString() === menuItem.item._id.toString()
            );

            if (existingGeneratedItem) {
                if (menuItem.quantity > existingGeneratedItem.quantity) {
                    menuItem.quantity -= existingGeneratedItem.quantity;
                    return true;
                } else {
                    return false;
                }
            }
            return true; 
        });

        if (newItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No new items to generate KOT for",
            });
        }

        const itemsByKitchen = newItems.reduce((acc, menuItem) => {
            const kitchen = menuItem.item.kitchen;
            if (!acc[kitchen]) acc[kitchen] = [];
            acc[kitchen].push({
                itemName: menuItem.item.itemName,
                quantity: menuItem.quantity,
                price: menuItem.item.price,
                itemId: menuItem.item._id,
            });
            return acc;
        }, {});

        const generatedKOTs = [];

        for (const kitchen in itemsByKitchen) {
            const items = itemsByKitchen[kitchen];

            const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

            const kot = await KOT.create({
                ticketNumber,
                tableName: table.name,
                operatorId,
                companyId,
                items: items.map((item) => ({
                    itemName: item.itemName,
                    quantity: item.quantity,
                    price: item.price,
                })),
            });

            items.forEach((item) => {
                const existingGeneratedItem = table.kotGeneratedItems.find(
                    (kotItem) => kotItem.item.toString() === item.itemId.toString()
                );

                if (existingGeneratedItem) {
                    existingGeneratedItem.quantity += item.quantity;
                } else {
                    table.kotGeneratedItems.push({
                        item: item.itemId,
                        quantity: item.quantity,
                    });
                }
            });

            generatedKOTs.push(kot);
        }

        await table.save();

        res.status(201).json({
            success: true,
            message: "KOTs generated successfully",
            data: generatedKOTs,
        });
    } catch (error) {
        console.error("Error generating KOT:", error.message);
        res.status(500).json({
            success: false,
            message: "Error generating KOT",
            error: error.message,
        });
    }
};



//bill generation api controller
// export const generateBillController = async (req, res) => {
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
//             });
//         }

//         if (!table.reserved) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Table is not reserved. No bill to generate.",
//             });
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
//                 const existingItem = billItems.find(
//                     (billItem) => billItem.itemName === item.itemName
//                 );

//                 if (existingItem) {
//                     const additionalAmount = item.quantity * existingItem.rate;
//                     existingItem.quantity += item.quantity;
//                     existingItem.amount += additionalAmount;

//                     totalAmount += additionalAmount;
//                 } else {
//                     const rate = item.price;
//                     const amount = item.quantity * rate;

//                     billItems.push({
//                         itemName: item.itemName,
//                         quantity: item.quantity,
//                         rate: rate,
//                         amount: amount,
//                     });

//                     totalAmount += amount;
//                 }
//             });
//         });

//         const bill = {
//             tableName: table.name,
//             items: billItems,
//             totalAmount,
//             operatorId,
//             companyId,
//             generatedAt: new Date(),
//         };

//         const savedBill = await Bill.create(bill);

//         // Reset table state
//         table.menuItems = [];
//         table.kotGeneratedItems = [];
//         table.reserved = false;
//         await table.save();

//         res.status(201).json({
//             success: true,
//             message: "Bill generated successfully",
//             data: savedBill,
//         });
//     } catch (error) {
//         console.error("Error generating bill:", error.message);
//         res.status(500).json({
//             success: false,
//             message: "Error generating bill",
//             error: error.message,
//         });
//     }
// };

export const generateBillController = async (req, res) => {
    try {
        const { tableId, operatorId } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
            });
        }

        // Fetch the table details and related KOTs
        const table = await Table.findOne({ _id: tableId, companyId }).populate(
            "kotGeneratedItems.item",
            "itemName price kitchen"
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        if (!table.reserved) {
            return res.status(400).json({
                success: false,
                message: "Table is not reserved. No bill to generate.",
            });
        }

        // Fetch all KOTs for this table
        const kots = await KOT.find({ tableName: table.name, companyId });

        if (!kots || kots.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No KOTs found for this table.",
            });
        }

        // Group KOT items by kitchen type
        const itemsByKitchen = kots.reduce((acc, kot) => {
            kot.items.forEach((item) => {
                const kitchen = item.kitchen || "Unknown Kitchen";
                if (!acc[kitchen]) acc[kitchen] = [];
                acc[kitchen].push(item);
            });
            return acc;
        }, {});

        const bills = [];

        // Generate a separate bill for each kitchen
        for (const kitchen in itemsByKitchen) {
            const items = itemsByKitchen[kitchen];
            let totalAmount = 0;

            const billItems = items.map((item) => {
                const amount = item.quantity * item.price;
                totalAmount += amount;

                return {
                    itemName: item.itemName,
                    quantity: item.quantity,
                    rate: item.price,
                    amount: amount,
                };
            });

            // Create the bill
            const bill = {
                tableName: table.name,
                items: billItems,
                totalAmount,
                operatorId,
                companyId,
                kitchen,
                generatedAt: new Date(),
            };

            const savedBill = await Bill.create(bill);
            bills.push(savedBill);
        }

        // Reset the table state
        table.menuItems = [];
        table.kotGeneratedItems = [];
        table.reserved = false;
        await table.save();

        res.status(201).json({
            success: true,
            message: "Bills generated successfully for each kitchen",
            data: bills,
        });
    } catch (error) {
        console.error("Error generating bills:", error.message);
        res.status(500).json({
            success: false,
            message: "Error generating bills",
            error: error.message,
        });
    }
};



// generate new bill 
export const generateNewBillController = async (req, res) => {
    try {
        const { tableId, operatorId } = req.body;
        const companyId = req.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required",
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
            })
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









