import {Router} from "express"
import {change_user_current_password, change_user_fullname, login_user, logout_user, register_user, renew_access_token} from "../controllers/user.controller.js"
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

// secured Routes
user_router.route("/logout").post(verify_jwt, logout_user)
user_router.route("/refresh-token").post(renew_access_token)
user_router.route("/change-user-password").post(verify_jwt, change_user_current_password)
user_router.route("/change-user-fullName").post(verify_jwt, change_user_fullname)
user_router.route("/change-user-avatar").post(verify_jwt, upload.single("avatar") , change_user_avatar)


export {user_router}