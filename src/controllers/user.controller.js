import {User} from "../models/user.model.js"
import {upload_on_cloudinary} from "../fileUpload/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const generate_access_refresh_tokens = async (user) => {
    try {
        const access_token = await user.generateAccessToken()
        const refresh_token = await user.generateRefreshToken()

        // Save refresh token into DB
        user.refresToken = refresh_token
        user.save({validateBeforeSave: false})

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
        secure: false
    })
    .cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: false
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

export {
    register_user,
    login_user,
    logout_user
}