import { StreamChat } from 'stream-chat';

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

console.log("========== STREAM INITIALIZATION ==========");

if (!apiKey || !apiSecret) {
  console.error("❌ STREAM ENV VARIABLES MISSING");
  console.error("STREAM_API_KEY:", apiKey);
  console.error("STREAM_SECRET_KEY:", apiSecret);
  throw new Error("Stream API key and secret must be set in environment variables");
}

console.log("Stream API Key Loaded:", apiKey);

const chatClient = StreamChat.getInstance(apiKey, apiSecret);

console.log("Stream client initialized successfully");

const upsertStreamUser = async (user) => {
    console.log("---------- STREAM UPSERT START ----------");
    console.log("User payload:", user);

    try {
        const response = await chatClient.upsertUsers([user]);

        console.log("Stream API response:", response);
        console.log("✅ Stream user upserted successfully");

        console.log("---------- STREAM UPSERT END ----------");
    } catch (error) {
        console.error("❌ STREAM UPSERT FAILED");
        console.error("Error:", error.response?.data || error);
        throw error;
    }
};

const deleteStreamUser = async (userId) => {
    console.log("---------- STREAM DELETE START ----------");
    console.log("User ID:", userId);
    try {
        const response = await chatClient.deleteUser(userId);
        console.log("Stream delete response:", response);
        console.log("✅ Stream user deleted successfully");

        console.log("---------- STREAM DELETE END ----------");
    } catch (error) {
        console.error("❌ STREAM DELETE FAILED");
        console.error("Error:", error.response?.data || error);
        throw error;
    }
};

export { upsertStreamUser, deleteStreamUser };