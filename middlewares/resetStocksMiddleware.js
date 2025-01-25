import cron from "node-cron";
import { CategoryItem } from "../models/adminModel.js"; 

const resetStocksMiddleware = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            console.log("Resetting stocks...");
            await CategoryItem.updateMany({}, { stock: 0 }); 
            console.log("Stocks reset successfully.");
        } catch (error) {
            console.error("Error resetting stocks:", error.message);
        }
    });

    console.log("Stock reset middleware initialized.");
};

export default resetStocksMiddleware;

