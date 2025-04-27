import {Router} from "express"
import register_user from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

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

export {user_router}