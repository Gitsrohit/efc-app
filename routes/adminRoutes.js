import express  from "express";
import userAuth from '../middlewares/authMiddlewares.js'
// import { uploadToBackblaze, uploadFileToBackblaze } from '../middlewares/multerBackblaze.js';
import upload from '../middlewares/fileUploadMiddlewares.js';
import multer from 'multer';
import path from 'path';
import {addCategoryController,addCategoryItem,getAllCategories,editCategoryController,editCategoryItemController,deleteCategoryController,deleteCategoryItemController,addTableController,deleteTableController,addMenuItemsToTable,getAllTables,getCategoryItems,generateKOTController,addAdController,getActiveAdsController,deactivateAdController} from "../controller/adminController.js";

const router = express.Router();

// const uploader = multer({
//     storage : multer.diskStorage({}),
//     limits : {fileSize : 500000}
// })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const uploader = multer({ storage });

//create routes
//category routes
router.post('/add-category',uploader.single('image'), addCategoryController);
router.get('/get-category', getAllCategories);
router.put("/edit-category/:id",uploader.single('image'), editCategoryController);
router.delete("/delete-category/:id", deleteCategoryController);

//item routes
router.post('/add-item', uploader.single('image'), addCategoryItem);
router.get('/get-item/:id', getCategoryItems);
router.put("/edit-category-item/:id",uploader.single('image'), editCategoryItemController);
router.delete("/delete-category-item/:id", deleteCategoryItemController);

//table routes
router.post('/add-table',  addTableController);
router.get('/get-all-table',  getAllTables);
router.delete("/delete-table/:id", deleteTableController);
router.post("/reserve-table/:tableId", addMenuItemsToTable);

//kot and billing rutes
router.post("/generate-table-kot",generateKOTController)

//advertisment routes
router.post('/add-Ad', upload.single('image'), addAdController);
router.get('/active-ads',getActiveAdsController)
router.patch('/deactivate-ads/:adId',deactivateAdController)

export default router


