import { clerkMiddleware, clerkClient } from '@clerk/express';
import User from '../models/User.js';
import { upsertStreamUser } from '../lib/stream.js';

const protectRoute = [
    clerkMiddleware(),
    async (req, res, next) => {
        try {
            const auth = req.auth?.();
            const clerkId = auth?.userId;
            console.log('[protectRoute] clerkId:', clerkId);

            if (!clerkId) {
                return res.status(401).json({
                    message: 'Unauthorized: Missing or expired Clerk session token',
                });
            }

            let user = await User.findOne({ clerkId });
            if (!user) {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const primaryEmail =
                    clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                    clerkUser.emailAddresses?.[0]?.emailAddress;

                if (!primaryEmail) {
                    return res.status(400).json({ message: 'Unauthorized: User email not found in Clerk' });
                }

                const name =
                    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                    primaryEmail.split('@')[0];

                user = await User.findOneAndUpdate(
                    { clerkId },
                    {
                        $setOnInsert: {
                            name,
                            email: primaryEmail,
                            profileImage: clerkUser.imageUrl || '',
                            clerkId,
                        },
                    },
                    { new: true, upsert: true }
                );

                await upsertStreamUser({
                    id: user.clerkId,
                    name: user.name,
                    image: user.profileImage,
                });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Error in protectRoute middleware:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
];

export default protectRoute;