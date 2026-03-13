import { requireAuth } from '@clerk/express';
import User from '../models/User.js';

const protectRoute = [
    requireAuth(),
    async (req, res, next) => {
        try {
            const clerkId = req.auth()?.userId;
            console.log("ClerkId: ", clerkId);
            if (!clerkId) {
                return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
            }

            // find user in DB by Clerk ID
            const user  = await User.findOne({ clerkId: clerkId });
            console.log("UserId", user);
            if (!user) {
                return res.status(401).json({ message: 'Unauthorized: User not found' });
            }

            // Attack User to request object
            req.user = user;
            next();
        } catch (error) {
            console.error('Error in protectRoute middleware:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
];

export default protectRoute;