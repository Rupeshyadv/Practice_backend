import dotenv from "dotenv"
dotenv.config({path: "./.env"})

import db_connect from "./src/db/db_connect.js";
import app from "./src/app.js"


const port = process.env.PORT || 8000

db_connect()
.then(() => {   
    app.listen(port, () => {
        console.log(`Server is running at port: ${port}`);
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed!");
})

/*
const app = express()
;( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
        app.on("error", () => {
            console.log("Database is connected successfully but express app is not able to deal with that!");
            throw error
        })
        
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }catch (error){
        console.error("error", error)
    }
})()
*/