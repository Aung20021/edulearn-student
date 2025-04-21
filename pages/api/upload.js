import multiparty from "multiparty";
import cloudinary from "cloudinary";

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable Next.js default body parser for file uploads
export const config = {
  api: { bodyParser: false },
};

export default async function handle(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new multiparty.Form();

  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Check if a file is uploaded
    if (!files?.file || files.file.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = files.file[0];

    // Determine the Cloudinary resource type
    const fileType = file.headers["content-type"];
    let resourceType = "auto"; // Default Cloudinary setting

    if (fileType.startsWith("image")) {
      resourceType = "image"; // For images (jpg, png, etc.)
    } else if (fileType.startsWith("video")) {
      resourceType = "video"; // For video files (mp4, mov, etc.)
    } else {
      resourceType = "raw"; // For PDFs, Word docs, etc.
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "eduLearn",
      public_id: `file_${Date.now()}`,
      resource_type: resourceType, // Set the appropriate type
    });

    // Return the uploaded file URL
    return res.status(200).json({ link: result.secure_url });
  } catch (error) {
    console.error("Error during file upload:", error);
    return res.status(500).json({ error: "File upload failed" });
  }
}
