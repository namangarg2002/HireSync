import { Inngest } from "inngest";
import connectDB from "./db.js";
import User from "../models/User.js";
import { upsertStreamUser, deleteStreamUser } from "./stream.js";

export const inngest = new Inngest({ id: "HireSync" });

export const syncUser = inngest.createFunction(
    {id: 'sync-user'},
    {event: 'clerk/user.created'},
    async ({ event }) => {
        console.log("========== INNGEST FUNCTION START ==========");
        console.log("Event received:", event.name);
        console.log("Event data:", event.data);
        
        try {
        console.log("Connecting to MongoDB...");
        await connectDB();
        console.log("MongoDB connection successful");

        const { id, first_name, last_name, email_addresses, profile_image_url } = event.data;

        const userPayload = {
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            email: email_addresses?.[0]?.email_address,
            profileImage: profile_image_url,
            clerkId: id
        };

        console.log("Creating MongoDB user with payload:", userPayload);

        const newUser = await User.create(userPayload);

        console.log("MongoDB user created successfully:", newUser);

        console.log("Calling Stream upsert...");
        await upsertStreamUser({
            id: newUser.clerkId.toString(),
            name: newUser.name,
            image: newUser.profileImage
        });

        console.log("Stream upsert completed successfully");

        console.log("========== INNGEST FUNCTION END ==========");

        } catch (error) {
        console.error("❌ ERROR inside syncUser function:");
        console.error(error);
        throw error;
        }
    },
);

export const deleteUserFromDB = inngest.createFunction(
    {id: 'delete-user-from-db'},
    {event: 'clerk/user.deleted'},
    async ({ event }) => {
        await connectDB();

        const { id } = event.data;

        await User.findOneAndDelete({ clerkId: id });

        await deleteStreamUser(id.toString());
    },
);

export default inngest;

export const functions = [syncUser, deleteUserFromDB];
