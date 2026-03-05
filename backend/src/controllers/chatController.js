import { chatClient } from '../lib/stream.js';

async function getStreamToken(req, res) {
    try {
        // use ClerkId for stream not mongodbID
        const token = chatClient.createToken(req.user.clerkId);
        res.status(200).json({ 
            token,
            userId: req.user.clerkId,
            userName: req.user.name,
            userImage: req.user.profileImage
        });
    } catch (error) {
        console.error("❌ FAILED TO CREATE STREAM TOKEN");
        console.error("Error:", error.response?.data || error);
        res.status(500).json({ error: "Failed to create Stream token" });
    }
}

export { getStreamToken };