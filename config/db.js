import mongoose from "mongoose";
import Color  from "colors";

const connectDb = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log(`Connected to MongoDB database ${mongoose.connection.host}`.bgMagenta.white)
    }catch(error){
        console.log(`MongoDB Error ${error}` .bgRed.white);
    }
}

export default connectDb;