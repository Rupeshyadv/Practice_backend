import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json({}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// routes import
import {user_router} from "./routes/user.routes.js"

// routes declaration 
app.use("/users", user_router)

export default app