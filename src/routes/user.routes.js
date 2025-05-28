import {Router} from "express"
import {login_user, logout_user, register_user} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verify_jwt } from "../middlewares/auth.middleware.js"

const user_router = Router()

user_router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    register_user
)

user_router.route("/login").post(login_user)
user_router.route("/logout").post(verify_jwt, logout_user)


export {user_router}