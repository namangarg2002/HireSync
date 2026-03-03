import { Inngest } from "inngest";
import connectDB from "./db.js";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "HireSync" });

const syncUser = inngest.createFunction(
    {id: 'sync-user'},
    {event: 'clerk/user.created'},
    async ({ event }) => {
        await connectDB();

        const { id, first_name, last_name, email_addresses, profile_image_url } = event.data;

        const newUser = new User({
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            email: email_addresses[0].email_address,
            profileImage: profile_image_url,
            clerkId: id
        });
        await User.create(newUser);
    },
);

const deleteUserFromDB = inngest.createFunction(
    {id: 'delete-user-from-db'},
    {event: 'clerk/user.deleted'},
    async ({ event }) => {
        await connectDB();

        const { id } = event.data;

        await User.findOneAndDelete({ clerkId: id });
    },
);

export default inngest;

export const functions = [syncUser, deleteUserFromDB];
