// //packages import
// // const express = require('express');
// import express from 'express';
// import 'express-async-errors';
// import dotenv from 'dotenv';
// import colors from 'colors';
// import cors from 'cors';
// import morgan from 'morgan';
// //security packages
// import helmet from 'helmet';
// import xss from 'xss-clean';
// import mongoSanitize from 'express-mongo-sanitize';

// // files import
// import connectDb from './config/db.js';
// // routes import
// import authRoutes from './routes/authRoutes.js';
// import errorMiddleware from './middlewares/errorMiddlewares.js';
// import adminRoutes from './routes/adminRoutes.js';


// //DOTENV config
// dotenv.config()

// //mongodb connection 
// connectDb();

// //create rest object
// const app = express();
// const PORT = process.env.PORT ||10000 ;

// //middlewares
// app.use(express.json());
// app.use(cors());
// app.use(morgan("dev"));
// app.use(helmet());
// app.use(xss());
// app.use(mongoSanitize());

// app.get('/', (req, res) => {
//     res.send('Its working');
// });

// // creating routes
// app.use("/api/v1/auth",authRoutes)
// app.use("/api/v1/admin" , adminRoutes)

// //validation middleware
// app.use(errorMiddleware);

// //listen
// app.listen(PORT , ()=>{
//     console.log(`listen in ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan.white);
// })


import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import colors from 'colors';
import cors from 'cors';
import morgan from 'morgan';

// Security packages
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';

// File imports
import connectDb from './config/db.js';
import { swaggerUi } from './config/swagger.js'; 
import swaggerFile from './config/swagger-output.json' with { type: "json" }; // Import generated JSON
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorMiddleware from './middlewares/errorMiddlewares.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDb();

// Create Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// Base route
app.get('/', (req, res) => {
    res.send('Its working');
});

// Swagger API documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
    console.log(`Listening in ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan.white);
    console.log(`Swagger Docs available at: http://localhost:${PORT}/api-docs`.yellow);
});
