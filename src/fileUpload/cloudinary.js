import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: "dx9p0t7ba",
    api_key: "968612691525592",
    api_secret: "NkonttP3NNKyXB43Qf81g6lhf-8"
})

const upload_on_cloudinary = async (local_file_path) => {
    try{
        if(!local_file_path) {
            console.log("local file path is absent!")
            return null
        }

        console.log("📤 Uploading to Cloudinary:", local_file_path);

        const response = await cloudinary.uploader.upload(
            local_file_path, 
            {
                resource_type: "auto"
            }
        )

        console.log("✅ Cloudinary Upload Success:", response.secure_url)
        

        fs.unlinkSync(local_file_path)

        return response
    }catch(error){
        console.error("❌ Cloudinary Upload Error:", error);

        fs.unlinkSync(local_file_path)
        return null
    }
}

export {upload_on_cloudinary}