const functions = require("firebase-functions");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your API keys
cloudinary.config({
  cloud_name: functions.config().cloudinary.cloud_name,
  api_key: functions.config().cloudinary.api_key,
  api_secret: functions.config().cloudinary.api_secret,
});
exports.deleteImageFromCloudinary = functions.https.onRequest(
    async (req, res) => {
      const publicId = req.body.publicId;

      // Ensure publicId is provided
      if (!publicId) {
        return res.status(400).send("Public ID is required.");
      }

      try {
        // Delete image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === "ok") {
          return res.status(200).send("Image deleted successfully.");
        } else {
          return res.status(500).send("Failed to delete image.");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        return res.status(500).send("Error deleting image: " + error.message);
      }
    });
