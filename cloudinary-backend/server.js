const express = require('express');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Initialize Express
const app = express();
app.use(express.json()); // To parse JSON data in requests

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Route to handle image deletion
app.post('/delete-image', async (req, res) => {
    const { publicId } = req.body;

    if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' });
    }

    try {
        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            res.status(400).json({ error: 'Failed to delete image' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
