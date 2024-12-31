import mongoose from "mongoose";
import {v4 as uuidv4} from 'uuid';

// CtegoryItem Schema
const categorySchema = new mongoose.Schema({
    // id: { type: String,
    //       unique: true, 
    //       default: uuidv4 
    // },
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        // enum: ['veg', 'non-veg'],
        required: true 
    },
    image: { 
        type: String,
        required: true
    },
    items: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' 
    }]
}, { timestamps: true });

const categoryItemSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4, 
        unique: true,  
    },
    /* "message": "Error adding menu item", "error": "E11000 duplicate key error collection: test-admin-db.categoryitems index: id_1 dup key: { id: null }"
    FOR THE ABOVE ISSUE I HAVE TO USE UUID PACKAGE TO GENERATE UNIQUE IDs
    */ 
    itemName: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    description: { 
        type: mongoose.Schema.Types.Mixed, 
        // required: true 
    },
    image: { 
        type: String,
        required: true 
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true 
    } 
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
    },
    items: [{
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        quantity: { type: Number, required: true },
    }],
    totalCost: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
}, { timestamps: true });

// Table Schema
const tableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    menuItems: [
        {
            item: { 
                type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' 
            },
            quantity: { 
                type: Number, 
                default: 1 
            },
        },
    ],
    reserved: {
        type: Boolean,
        default: false, 
    },
}, { timestamps: true });

export const Category = mongoose.model('Category', categorySchema);
export const CategoryItem = mongoose.model('CategoryItem',categoryItemSchema);
export const Order = mongoose.model('Order', orderSchema);
export const Table = mongoose.model('Table', tableSchema);
