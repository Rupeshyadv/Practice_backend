import {Router} from "express"
import register_user from "../controllers/user.controller.js"

const user_router = Router()

user_router.route("/register").post(register_user)

export {user_router}