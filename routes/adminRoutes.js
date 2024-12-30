import express  from "express";
import userAuth from '../middlewares/authMiddlewares.js'
import upload from '../middlewares/fileUploadMiddlewares.js';
import {addCategoryController,addCategoryItem,getAllCategories,editCategoryController,editCategoryItemController,deleteCategoryController,deleteCategoryItemController,addTableController,deleteTableController} from "../controller/adminController.js";

const router = express.Router();

//create routes
//category routes
router.post('/add-category', upload.single('image'), addCategoryController);
router.get('/get-category', getAllCategories);
router.put("/edit-category/:id",upload.single('image'), editCategoryController);
router.delete("/delete-category/:id", deleteCategoryController);

//item routes
router.post('/add-item', upload.single('image'), addCategoryItem);
router.put("/edit-category-item/:id",upload.single('image'), editCategoryItemController);
router.delete("/delete-category-item/:id", deleteCategoryItemController);

//table routes
router.post('/add-table',  addTableController);
router.delete("/delete-table/:id", deleteTableController);

export default router


