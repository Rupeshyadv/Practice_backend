import {User} from "../models/user.model.js"
import {upload_on_cloudinary} from "../fileUpload/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { findAncestor } from "typescript";

const generate_access_refresh_tokens = async (user) => {
    try {
        const access_token = await user.generateAccessToken()
        const refresh_token = await user.generateRefreshToken()

        // Save refresh token into DB
        user.refreshToken = refresh_token
        await user.save({validateBeforeSave: false})

        return {access_token, refresh_token}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access or refresh tokens")
    }
}

const register_user = async (req, res) => {
    // validate user credentials
    // check if the user already exists
    // check for images and avatar
    // upload them to cloudinary (via multer)
    // create user object for DB 
    // check response from DB (like user created successfully or not)
    // If it is created then return the response 

    const {username, email, password, fullName} = req.body

    if(username === ""){
        throw new ApiError(400, "Username is required.")
    }

    if(fullName === ""){
        throw new ApiError(400, "Fullname is required.")
    }

    if(!email){
      throw new ApiError(400, "email is required.")
    }
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if(!regex.test(email)){
        throw new ApiError(400, "please enter a valid email.")
    }

    if(!password){
        throw new ApiError(400, "Password is required.")
    }
    if(password & password.length < 8){
        throw new ApiError(400, "Password must have at least 8 characters.")
    }

    // If user exists!
    const user_exists = await User.findOne({
        $or: [{username}, {email}]
    })
    if(user_exists){
        throw new ApiError(400, "Email is already registered.")
    }

    let avatar_file_local_path;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatar_file_local_path = req.files.avatar[0].path;
    }

    let coverImage_file_local_path;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImage_file_local_path = req.files.coverImage[0].path;
    }
    
    const avatar = await upload_on_cloudinary(avatar_file_local_path)
    const coverImage = await upload_on_cloudinary(coverImage_file_local_path ? coverImage_file_local_path : null)
    
    if(!avatar){
        return res.status(400).json({
        success: false,
    })
    }

    // push in DB
    const user = await User.create({
        username: username,
        fullName: fullName,
        email: email,
        password: password,
        avatar: avatar.url, 
        coverImage: coverImage?.url || ""
    })

    const created_user = await User.findById(user._id).select(
        "-password -refreshToken"
    )    

    if(!created_user){
        throw new ApiError(500, "Something went wrong...")
    }

    return res.status(201).json({
        success: true,
        created_user
    })
}

const login_user = async(req, res) => {
    const {username, email, password} = req.body

    if(!email || !password ){
        throw new ApiError(400, "Something is missing")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist, Register First!")
    }

    const is_password_correct = await user.isPasswordCorrect(password)   
    
    if(!is_password_correct){
        throw new ApiError(404, "Wrong Password")
    }

    // Generate Tokens
    const {access_token, refresh_token} = await generate_access_refresh_tokens(user)

    const loggedIn_user = await User.findOne(user._id).select("-password -refreshToken")    

    return res.status(201)
    .cookie("accessToken", access_token, {
        httpOnly: true,
        secure: true
    })
    .cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: true
    })
    .json({loggedIn_user})
}

const logout_user = async(req, res) => {
    const loggedOut_user = await User.findOneAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
            } 
        },
        {new: true}
    )

    return res.status(201)
    .clearCookie("accessToken", {
        httpOnly: true,
        secure: true
    })
    .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true
    })
    .json(loggedOut_user)
}

const renew_access_token = async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decoded_token = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decoded_token._id)
    
        if(!user){
            throw new ApiError(400, "Refresh Token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(400, "Refresh token is expired or used")
        }
    
        const {new_access_token, new_refresh_token} = await generate_access_refresh_tokens(user)

        // Push in DB
        user.refreshToken = new_refresh_token
        await user.save({validateBeforeSave: false})
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(201)
        .cookie("accessToken", new_access_token, options)
        .cookie("refreshToken", new_refresh_token, options)
        .json({
            access_token: new_access_token,
            refreshToken: new_refresh_token
        })
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Refresh Token")
    }
}


const change_user_current_password = async (req, res) => {
    const {current_password, new_password} = req.body

    const user = await User.findById(req.user?._id)

    if (! await user.isPasswordCorrect(current_password)){
        throw new ApiError(400, "Wrong current password")
    }

    if(!new_password){
        throw new ApiError(400, "Password is required.")
    }
    if(new_password.length < 8){
        throw new ApiError(400, "Password must have at least 8 characters.")
    }

    user.password = new_password
    await user.save({validateBeforeSave: false})

    return res.status(201).json({"201": "password changed successfully"})
} 

const get_current_user = async (req, res) => {    
    return res.status(200).json({success: true, data: req.user})
}

const change_user_fullname = async (req, res) => {
    const {fullName} = req.body

    if(!fullName){
        throw new ApiError(401, "Invalid Fullname")
    }

    if (!req.user ){
        throw new ApiError(401, "Unauthorized User request")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id, 
        {
            fullName: fullName
        },
        {new: true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json({success: true, data: user})
}

const change_user_avatar = async (req, res) => {
    let avatar_file_local_path;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatar_file_local_path = req.files.avatar[0].path;
    }

    if(!avatar_file_local_path){
        throw new ApiError(400, "avatar file is invalid or absent")
    }

    const avatar = await upload_on_cloudinary(avatar_file_local_path)

    if(!avatar || !avatar.url){
        throw new ApiError(502, "upload problem on cloudinary")
    }

    if (!req.user){
        throw new ApiError(401, "Unauthorized User request")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {avatar: avatar.url},
        {new: true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json({success: true, data: user})
}

const change_user_coverImage = async (req, res) => {
    let coverImage_file_local_path;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImage_file_local_path = req.files.coverImage[0].path;
    }

    if(!coverImage_file_local_path){
        throw new ApiError(400, "coverImage file is invalid or absent")
    }

    const coverImage = await upload_on_cloudinary(coverImage_file_local_path)

    if(!coverImage || !coverImage.url){
        throw new ApiError(500, "upload problem on cloudinary")
    }

    if (!req.user){
        throw new ApiError(401, "Unauthorized User request")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {coverImage: coverImage.url},
        {new: true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json({success: true, data: user})
}


export {
    register_user,
    login_user,
    logout_user,
    renew_access_token,
    change_user_current_password,
    get_current_user,
    change_user_fullname,
    change_user_avatar,
    change_user_coverImage
}