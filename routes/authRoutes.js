import express from 'express';
import { loginController, registerController } from '../controller/authController.js';
import rateLimit from 'express-rate-limit';

//IP Limiter
const limiter = rateLimit({
    windowMs : 15*60*1000, //15 miutes
    max:100, 
    standardHeaders : true,
    legacyHeaders : false, //Disable the `X-RateLimit-*` headers
})

//router object
const router = express.Router();

//routes

// REGISTER||POST method used
router.post('/register' ,limiter, registerController);

// LOGIN||POST method used
router.post('/login' ,limiter, loginController)

//export
export default router;