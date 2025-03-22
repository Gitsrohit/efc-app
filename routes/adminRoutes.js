import express  from "express";
import userAuth from '../middlewares/authMiddlewares.js'
// import { uploadToBackblaze, uploadFileToBackblaze } from '../middlewares/multerBackblaze.js';
import upload from '../middlewares/fileUploadMiddlewares.js';
import multer from 'multer';
import path from 'path';
import resetStocksMiddleware from "../middlewares/resetStocksMiddleware.js";
import {addCategoryController,addCategoryItem,getAllCategories,editCategoryController,editCategoryItemController,deleteCategoryController,deleteCategoryItemController,addTableController,deleteTableController,addMenuItemsToTable,getAllTables,getCategoryItems,generateKOTController,addAdController,getActiveAdsController,deactivateAdController,upsertAdminProfile,getAdminProfile,registerAdminController,generateBillController,generateNewBillController,addStockController,generateOnlineKOTController,generateOnlineBillController,addNewFacility,getAllFacilities,getFacilityById,updateFacility,deleteFacility,bookFacility,unbookFacility,showBillController} from "../controller/adminController.js";

import { companyMiddleware } from "../middlewares/companyAuthMiddleware.js";

const router = express.Router();
resetStocksMiddleware();

// const uploader = multer({
//     storage : multer.diskStorage({}),
//     limits : {fileSize : 500000}
// })
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); 
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     },
// });

const storage = multer.memoryStorage();
const uploader = multer({ storage });

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = 'uploads/';
//         console.log('Destination Path:', uploadPath);
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const fileName = `${Date.now()}-${file.originalname}`;
//         console.log('File Name:', fileName);
//         cb(null, fileName);
//     },
// });
// const uploader = multer({ storage });

//create routes
//category routes
router.post('/add-category',companyMiddleware,uploader.single('image'), addCategoryController);
router.get('/get-category', companyMiddleware,getAllCategories);
router.put("/edit-category/:id",companyMiddleware,uploader.single('image'), editCategoryController);
router.delete("/delete-category/:id",companyMiddleware, deleteCategoryController);

//item routes
router.post('/add-item', companyMiddleware, uploader.single('image'), addCategoryItem);
router.get('/get-item/:id',companyMiddleware, getCategoryItems);
router.put("/edit-category-item/:id",companyMiddleware,uploader.single('image'), editCategoryItemController);
router.delete("/delete-category-item/:id", companyMiddleware,deleteCategoryItemController);
router.post('/add-stock', companyMiddleware, addStockController);

//table routes
router.post('/add-table', companyMiddleware, addTableController);
router.get('/get-all-table', companyMiddleware, getAllTables);
router.delete("/delete-table/:id",companyMiddleware, deleteTableController);
router.post("/reserve-table/:tableId",companyMiddleware, addMenuItemsToTable);

//kot and billing rutes
router.post("/generate-table-kot",companyMiddleware,generateKOTController)
router.get("/show-bill/:tableId",companyMiddleware,showBillController)
router.post("/generate-online-kot",companyMiddleware,generateOnlineKOTController)
router.post("/generate-table-bill",companyMiddleware,generateBillController)
router.post("/generate-table-bill-new",companyMiddleware,generateNewBillController)
router.post("/generate-online-bill",companyMiddleware,generateOnlineBillController)

//advertisment routes
router.post('/add-Ad',companyMiddleware, upload.single('image'), addAdController);
router.get('/active-ads',companyMiddleware, getActiveAdsController)
router.patch('/deactivate-ads/:adId',companyMiddleware, deactivateAdController)

//adminProfile routes
router.post('/adminProfile',upsertAdminProfile);
router.get('/adminProfile/:companyId',getAdminProfile);
router.post('/register-admin',registerAdminController)

//facilities routes
router.post("/add-facility", companyMiddleware, uploader.array("images", 5), addNewFacility);
router.get("/get-facilities", getAllFacilities);
router.get("/get-facility/:id", getFacilityById);
router.put("/edit-facility/:id", companyMiddleware, uploader.array("images", 5), updateFacility);
router.delete("/delete-facility/:id", companyMiddleware, deleteFacility);
router.put('/book-facility/:facilityId', companyMiddleware, bookFacility);
router.put('/unbook-facility/:id', companyMiddleware, unbookFacility);


export default router


