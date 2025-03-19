import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const db_connect = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Mongo DB is connected! DB HOST: ${connectionInstance.connection.host}`);
    }catch(error){
        console.error("Error", error)
    }
}

export default db_connect