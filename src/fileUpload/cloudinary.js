import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const upload_on_cloudinary = async (local_file_path) => {
    try{
        if(!local_file_path) {
            return console.error("local_file_path is absent");
        }
        const response = await cloudinary.uploader.upload(
            local_file_path, 
            {
                resource_type: "auto"
            }
        )

        return response
    }catch(error){
        fs.unlinkSync(local_file_path)
        return 
    }
}

export default upload_on_cloudinary