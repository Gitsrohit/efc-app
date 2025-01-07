import mongoose from "mongoose";
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


// add-category controller
export const addCategoryController = async (req, res) => {
    try {
        const {name} = req.body;
        const file = req.file ? req.file.path : null;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // const imageUrl = await uploadFile.uploadFile(file);
        const imageUrl = await uploadFile(file, 'categories');

        const existingCategory = await Category.findOne({name});
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const newCategory = await Category.create({
            name,
            image: imageUrl
        });

        res.status(201).json(
            {success: true,
            message: "New category added successfully",
            data: newCategory,})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// get all category controller
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find(); 
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
        const imagePath = req.file ? req.file.path : null; 

        const updateData = {};
        if (name) updateData.name = name;

        if (imagePath) {
            const imageUrl = await uploadFile(imagePath, 'categories');
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

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
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
        const {itemName, type, kitchen, price, categoryId, description} = req.body;
        const file = req.file ? req.file.path : null; 

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message:'Category not found'});
        }

        const imageUrl = await uploadFile(file, 'categories');

        const newItem = await CategoryItem.create({
            itemName,
            type,
            kitchen,
            price,
            description,
            image:imageUrl,
            category: categoryId
        });

        category.items.push(newItem._id);
        await category.save();

        res.status(201).json({ message: 'Menu item added successfully', item: newItem });
    } catch (error) {
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

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID',
            });
        }

        const category = await Category.findById(categoryId).populate('items');

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
        const imagePath = req.file ? req.file.path : null; 

        const updateData = {};
        if (itemName) updateData.itemName = itemName;
        if (price) updateData.price = price;
        if (description) updateData.description = description;
        if (imagePath) {
            const imageUrl = await uploadFile(imagePath, 'categories');
            updateData.image = imageUrl;
        }
        // if (imagePath) updateData.image = imagePath;
        if (categoryId) updateData.category = categoryId;
        if (type) updateData.type = type;

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

        const categoryItem = await CategoryItem.findById(itemId);
        if (!categoryItem) {
            return res.status(404).json({
                success: false,
                message: "Category item not found",
            });
        }

        const categoryId = categoryItem.category;
        await Category.findByIdAndUpdate(
            categoryId,
            {$pull: {items: itemId}},
            {new: true}
        );

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

// add table controller
export const addTableController = async (req, res) => {
    try {
        const {name} = req.body;

        const existingTable = await Table.findOne({name});
        if (existingTable) {
            return res.status(400).json({success: false, message: "Table already exists"});
        }

        const newTable = await Table.create({name});

        res.status(201).json({ success: true, message: "Table added successfully", data: newTable });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding table", error: error.message });
    }
};

//get table controller
export const getAllTables = async (req, res) => {
    try {
        const tables = await Table.find().populate('menuItems.item', 'itemName price');
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

        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        for (const {itemId, quantity} of items) {
            const menuItem = await CategoryItem.findById(itemId);
            if (!menuItem) {
                return res.status(404).json({ success: false, message: `Menu item not found: ${itemId}` });
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

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: foodItemName, description",
            });
        }

        const imageUrl = await uploadFile(file, 'categories');

        const newAd = await Ad.create({
            name,
            description,
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
        const ads = await Ad.find({isActive: true});

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
        const {adId} = req.params;
        const ad = await Ad.findById(adId);

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
export const generateKOTController = async (req, res) => {
    try {
        const { tableId, operatorId } = req.body;

        const table = await Table.findById(tableId).populate(
            'menuItems.item',
            'itemName'
        );

        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        const newItems = table.menuItems
            .map((menuItem) => {
                const alreadyInKOT = table.kotGeneratedItems.find(
                    (kotItem) => kotItem.item.toString() === menuItem.item._id.toString()
                );

                const newQuantity = alreadyInKOT
                    ? menuItem.quantity - alreadyInKOT.quantity
                    : menuItem.quantity; 

                if (newQuantity > 0) {
                    return {
                        item: menuItem.item,
                        quantity: newQuantity, 
                    };
                }

                return null; 
            })
            .filter(Boolean);

        if (newItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No new items to generate KOT for",
            });
        }

        const ticketNumber = `KOT-${Math.floor(10000 + Math.random() * 90000)}`;

        const kotItems = newItems.map((newItem) => ({
            itemName: newItem.item.itemName,
            quantity: newItem.quantity,
        }));

        const kot = await KOT.create({
            ticketNumber,
            tableName: table.name,
            operatorId,
            items: kotItems,
        });

        newItems.forEach((newItem) => {
            const existingGeneratedItem = table.kotGeneratedItems.find(
                (kotItem) => kotItem.item.toString() === newItem.item._id.toString()
            );

            if (existingGeneratedItem) {
                existingGeneratedItem.quantity += newItem.quantity;
            } else {
                table.kotGeneratedItems.push({
                    item: newItem.item._id,
                    quantity: newItem.quantity, 
                });
            }
        });

        await table.save();

        res.status(201).json({
            success: true,
            message: "Kitchen Order Ticket generated successfully",
            data: kot,
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







