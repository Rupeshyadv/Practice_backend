import {User} from "../models/user.model.js"
 
const register_user = async (req, res) => {
    // validate user credentials
    // check if the user already exists
    // check for images and avatar
    // upload them to cloudinary (via multer)
    // create user object for DB 
    // check response from DB (like user created successfully or not)

    const {username, email, password, refreshToken, fullName, avatar, coverImage} = req.body
    console.log("username: ", username)

    // validation
    if(username.trim() === ""){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_INPUT",
                message: "Username is required."
            }
        });
    }
    if(fullName.trim() === ""){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_INPUT",
                message: "Fullname is required."
            }
        });
    }
    // email validation!
    if(!email){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_INPUT",
                message: "email is required."
            }
        })
    }
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if(!regex.test(email)){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_EMAIL_FORMAT",
                message: "please provide a valid email."
            }
        })
    }
    if(!password){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_PASSWORD",
                message: "Password is required."
            }
        })
    }
    if(password & password.length() < 8){
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_PASSWORD",
                message: "Password should have at least 8 characters."
            }
        })
    }

    // If user exists!
    const user_exists = await User.findOne({
        $or: [{username}, {email}]
    })
    if(user_exists){
        return res.status(400).json({
            success: false,
            error: {
                code: "EMAIL_EXISTS",
                message: "Email is already registered."
            }
        })
    }


}

export default register_user