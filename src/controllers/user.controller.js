import {User} from "../models/user.model.js"
import {upload_on_cloudinary} from "../fileUpload/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";
import path from "path"
import { error } from "console";

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

    console.log(req.files)

    let avatar_file_local_path;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatar_file_local_path = path.resolve(req.files.avatar[0].path).replace(/\\/g, "/");
    }

    let coverImage_file_local_path;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImage_file_local_path = path.resolve(req.files.coverImage[0].path).replace(/\\/g, "/");
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

export {register_user}