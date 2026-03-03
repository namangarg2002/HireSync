import { StreamChat } from 'stream-chat';

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

if (!apiKey || !apiSecret) {
  throw new Error('Stream API key and secret must be set in environment variables');
}

const chatClient = StreamChat.getInstance(apiKey, apiSecret);

const upsertStreamUser = async (user) => {
    try {
        await chatClient.upsertUser(user);
        console.log("Stream user upserted successfully", user);
    } catch (error) {
        console.error('Error upserting Stream user:', error);
        throw error;
    }
};

const deleteStreamUser = async (userId) => {
    try {
        await chatClient.deleteUser(userId);
        console.log("Stream user deleted successfully", userId);
    } catch (error) {
        console.error('Error deleting Stream user:', error);
        throw error;
    }
};

export { upsertStreamUser, deleteStreamUser };