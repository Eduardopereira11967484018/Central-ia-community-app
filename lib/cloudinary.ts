import axios from "axios"

export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "community_app") // Create an unsigned upload preset in your Cloudinary dashboard

    // Get Cloudinary URL from environment variable or use default
    const cloudinaryUrl =
      process.env.NEXT_PUBLIC_CLOUDINARY_URL || "https://api.cloudinary.com/v1_1/dhyhrdlws/image/upload"

    // Upload the file to Cloudinary
    const response = await axios.post(cloudinaryUrl, formData)

    // Return the secure URL of the uploaded image
    return response.data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload image")
  }
}
