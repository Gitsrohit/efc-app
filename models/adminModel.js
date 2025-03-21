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
    image: { 
        type: String,
        required: true
    },
    companyId: { 
        type: String, 
        required: true 
    },
    items: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' 
    }]
}, { timestamps: true });


const categoryItemSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: uuidv4, // Automatically generate a unique ID
            unique: true,
        },
        itemName: { 
            type: String, 
            required: true 
        },
        type: { 
            type: String, 
            required: true 
        },
        kitchen: {
            type: String,
            required: true
        },
        price: { 
            type: Number, 
            required: true 
        },
        description: { 
            type: mongoose.Schema.Types.Mixed, 
        },
        image: { 
            type: String, 
            required: true 
        },
        companyId: { 
            type: String, 
            required: true 
        },
        category: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category', 
            required: true 
        },
        stock: { 
            type: Number, 
            default: 0, 
            required: true 
        }
    },
    { timestamps: true }
);

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

//Table Schema
// const tableSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     menuItems: [
//         {
//             item: { 
//                 type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' 
//             },
//             quantity: { 
//                 type: Number, 
//                 default: 1 
//             },
//             price: { 
//                 type: Number, 
//                 required: true, 
//             },
//         },
//     ],
//     reserved: {
//         type: Boolean,
//         default: false, 
//     },
//     companyId: { 
//         type: String, 
//         required: true 
//     },
//     kotGeneratedItems: [
//         {
//             item: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' },
//             quantity: { type: Number, default: 1 },
//         },
//     ],
// }, { timestamps: true });

// const tableSchema = new mongoose.Schema(
//     {
//       name: {
//         type: String,
//         required: true,
//         unique: true,
//       },
//       reserved: {
//         type: Boolean,
//         default: false,
//       },
//       companyId: {
//         type: String,
//         required: true,
//       },
//       menuItems: [
//         {
//           item: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryItem' },
//           quantity: { type: Number, default: 1 },
//           price: { type: Number, required: true },
//         },
//       ],
//     },
//     { timestamps: true }
//   ); //original table schema

const tableSchema = new mongoose.Schema(
  {
      name: {
          type: String,
          required: true,
          unique: true,
      },
      reserved: {
          type: Boolean,
          default: false,
      },
      companyId: {
          type: String,
          required: true,
      },
      menuItems: [
          {
              item: { type: mongoose.Schema.Types.ObjectId, ref: "CategoryItem" },
              quantity: { type: Number, default: 1 },
              price: { type: Number, required: true },
          },
      ],
      kotGeneratedItems: [
          {
              type: mongoose.Schema.Types.ObjectId,
              ref: "KOT", 
          },
      ],
  },
  { timestamps: true }
);

// bill model

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    tableName: {
      type: String,
      required: true,
    },
    companyId: {
      type: String,
      required: true,
    },
    operatorId: {
      type: String,
      required: true,
    },
    kotNumbers: [
      {
        type: String,
      },
    ],
    items: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Other"],
      required: true,
    },
  },
  { timestamps: true }
); 
  
// const kotSchema = new mongoose.Schema({
//     ticketNumber: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     tableName: {
//         type: String,
//         required: true,
//     },
//     billDate: {
//         type: Date,
//         default: Date.now,
//     },
//     companyId: { 
//         type: String, 
//         required: true 
//     },
//     operatorId: {
//         type: String, 
//         required: true,
//     },
//     items: [
//         {
//             itemName: { type: String, required: true },
//             quantity: { type: Number, required: true },
//             price: { type: Number, required: true }, 
//         },
//     ],
// }, { timestamps: true });

// const kotSchema = new mongoose.Schema(
//     {
//       ticketNumber: {
//         type: String,
//         required: true,
//         unique: true,
//       },
//       tableName: {
//         type: String,
//         required: true,
//       },
//       billDate: {
//         type: Date,
//         default: Date.now,
//       },
//       companyId: {
//         type: String,
//         required: true,
//       },
//       operatorId: {
//         type: String,
//         required: true,
//       },
//       items: [
//         {
//           itemName: { type: String, required: true },
//           quantity: { type: Number, required: true },
//           price: { type: Number, required: true },
//         },
//       ],
//     },
//     { timestamps: true }
//   );//to be used in case

const kotSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    tableName: {
      type: String,
      default: null, // Optional for online orders
    },
    orderId: {
      type: String,
      required: function () {
        return this.tableName === null; // Required only for online orders
      },
      unique: true,
      sparse: true, // Allows this field to be optional while maintaining uniqueness
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    companyId: {
      type: String,
      required: true,
    },
    operatorId: {
      type: String,
      required: true,
    },
    items: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
); 

const adSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String, 
            required: true,
        },
        companyId: { 
            type: String, 
            required: true 
        },
        isActive: {
            type: Boolean,
            default: true, 
        },
    },
    { timestamps: true }
);

const AdminProfileSchema = new mongoose.Schema({
    restaurantName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    state: { type: String, required: true },
    contactNo: { type: String, required: true },
    emailId: { type: String, required: true },
    gstin: { type: String },
    cin: { type: String },
    baseCurrency: { type: String, required: true },
    currencyCode: { type: String, required: true },
    ticketFooterMessage: { type: String },
    startBillNo: { type: Number, default: 1 },
    showLogoInReceipts: { type: Boolean, default: false },
    companyId: { type: String, required: true, unique: true },
  }, { timestamps: true });
  

// const billSchema = new mongoose.Schema({
//     tableName: {
//         type: String,
//         required: true,
//     },
//     items: [
//         {
//             itemName: { type: String, required: true },
//             quantity: { type: Number, required: true },
//             rate: { type: Number, required: true },
//             amount: { type: Number, required: true },
//         },
//     ],
//     totalAmount: {
//         type: Number,
//         required: true,
//     },
//     operatorId: {
//         type: String,
//         required: true,
//     },
//     companyId: {
//         type: String,
//         required: true,
//     },
//     generatedAt: {
//         type: Date,
//         default: Date.now,
//     },
// }, { timestamps: true });

// const billSchema = new mongoose.Schema({
//     billNumber: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     orderNumber: {
//       type: String,
//       required: true,
//     },
//     billDate: {
//       type: Date,
//       default: Date.now,
//     },
//     tableName: {
//       type: String,
//       required: true,
//     },
//     companyId: {
//       type: String,
//       required: true,
//     },
//     operatorId: {
//       type: String,
//       required: true,
//     },
//     kotNumbers: [String],
//     items: [
//       {
//         itemName: String,
//         quantity: Number,
//         price: Number,
//       },
//     ],
//     totalAmount: Number,
//     paymentMode: String,
//   }); // purana bill schema agar kuch problem hua toh isko chala do


const onlineBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    customerName: {
      type: String,
      required: true,
    },
    companyId: {
      type: String,
      required: true,
    },
    operatorId: {
      type: String,
      required: true,
    },
    items: [
      {
        itemName: String,
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: Number,
    paymentMode: String,
  },
  { timestamps: true }
);

  
const BillSchema = new mongoose.Schema({
    tableName: {
        type: String,
        required: true,
    },
    items: [
        {
            itemName: { type: String, required: true },
            quantity: { type: Number, required: true },
            rate: { type: Number, required: true },
            amount: { type: Number, required: true },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    operatorId: {
        type: String,
        required: true,
    },
    companyId: {
        type: String,
        required: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });


const newFacilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    capacity: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    description: { type: String },
    pictureUrls: { type: [String], default: [] }, 
    companyId: {
      type: String,
      required: true,
    },
}, { timestamps: true });




export const Category = mongoose.model('Category', categorySchema);
export const CategoryItem = mongoose.model('CategoryItem',categoryItemSchema);
export const Order = mongoose.model('Order', orderSchema);
export const Table = mongoose.model('Table', tableSchema);
export const KOT = mongoose.model('KOT', kotSchema);
export const Ad = mongoose.model('Ad', adSchema);
export const AdminProfile = mongoose.model('AdminProfile', AdminProfileSchema);
export const Bill = mongoose.model('Bill', billSchema);
export const NewBill = mongoose.model("NewBill", BillSchema);
export const OnlineBill = mongoose.model("OnlineBill", onlineBillSchema);
export const NewFacility = mongoose.model("NewFacility", newFacilitySchema);
