import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"

const verify_jwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const verified_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        if(!verified_token){
            throw new ApiError(401, "Token Verification Failed, Invalid Access Token")
        }
    
        const user = await User.findById(verified_token._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(400, "Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        return next(new ApiError(400, error?.message || "Invalid Access Token"))
    }
}

export {verify_jwt}