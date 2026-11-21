import Session from '../models/Session.js';
import { streamClient, chatClient } from '../lib/stream.js';
async function createSession(req, res) {
    try {
        const { problem, difficulty } = req.body;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        if (!problem || !difficulty) {
            return res.status(400).json({ message: 'Problem and difficulty are required' });
        }

        // generate a unique callId for stream Video
        const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // create session in db
        const session  = await Session.create({
            problem,
            difficulty,
            host: userId,
            callId
        });

        // create a stream Video call
        await streamClient.video.call('default', callId).getOrCreate({
            data: {
                created_by_id: clerkId,
                custom: {
                    problem,
                    difficulty,
                    sessionId: session._id.toString(),
                }
            }
        });

        // chat messaging 
        const channel = chatClient.channel('messaging', callId, {
            name: `${problem} Session`,
            created_by_id: clerkId,
            members: [clerkId]
        });

        await channel.create();
        res.status(201).json({ message: 'Session created successfully', sessionId: session._id });
    } catch (error) {
        console.log("Error creating session:", error.message);
        res.status(400).json({ message: 'Invalid session data' });
    }
}

async function getActiveSession(_, res) {
    try {
        const sessions = await Session.find({status: 'active'})
        .populate('host', 'name profileImage email clerkId')
        .populate("participant", "name profileImage email clerkId")
        .sort({ createdAt: -1 })
        .limit(20);
        res.status(200).json({ sessions });
    } catch (error) {
        console.log("Error fetching active sessions:", error.message);
        res.status(500).json({ message: 'Error fetching active sessions' });
    }
}

async function getMyRecentSessions(req, res) {
    try {
        const userId = req.user._id;

        // get sessions where the user is host or participent4
        const sessions = await Session.find({
            status: 'completed',
            $or: [{
                host: userId
            }, {
                participant: userId
            }]
        }).sort({ createdAt: -1 }).limit(20)

        res.status(200).json({ sessions });

    } catch (error) {
        console.log("Error fetching my recent sessions:", error.message);
        res.status(500).json({ message: 'Error fetching my recent sessions' });
    }
}


async function getSessionById(req, res) {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId)
        .populate('host', 'name profileImage email clerkId')
        .populate('participant', 'name profileImage email clerkId');
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.status(200).json({ session });
    } catch (error) {
        console.log("Error fetching session by ID:", error.message);
        res.status(500).json({ message: 'Error fetching session by ID' });
    }
}


async function joinSession(req, res) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if(session.status !== 'active'){
            return res.status(400).json({ message: "Cannot join a complete session"});
        }

        if(session.host.toString() === userId.toString()){
            return res.status(400).json({ message: "Host cannot join their own session as participant" });
        }

        // check is the sesion is 1:1 or not 
        if(session.participant) {
            return res.status(409).json({ message: 'Session is already full' });
        }

        session.participant = userId;
        await session.save();

        const channel = chatClient.channel("messaging", session.callId);
        await channel.addMembers([clerkId]);

        res.status(200).json({ message: 'Successfully joined session' });
    } catch (error) {
        console.log("Error joining session:", error.message);
        res.status(500).json({ message: 'Error joining session' });
    }
}

async function leaveSession(req, res) {
    console.log('[leaveSession] hit:', {
        method: req.method,
        originalUrl: req.originalUrl,
        sessionId: req.params.sessionId,
        userId: req.user?._id,
        clerkId: req.user?.clerkId,
    });

    try {
        const { sessionId } = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        const session = await Session.findById(sessionId);
        if (!session) {
            console.log('[leaveSession] 404 Session not found:', sessionId);
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.status !== 'active') {
            console.log('[leaveSession] 400 Session not active:', session.status);
            return res.status(400).json({ message: 'Cannot leave a completed session' });
        }

        if (session.host.toString() === userId.toString()) {
            console.log('[leaveSession] 400 User is host:', userId.toString());
            return res.status(400).json({ message: 'Host cannot leave session; end the session instead' });
        }

        if (!session.participant || session.participant.toString() !== userId.toString()) {
            console.log('[leaveSession] 400 Participant mismatch:', {
                participant: session.participant?.toString() ?? null,
                userId: userId.toString(),
            });
            return res.status(400).json({ message: 'You are not the participant in this session' });
        }

        session.participant = null;
        await session.save();
        console.log('[leaveSession] Cleared participant in MongoDB for session:', sessionId);

        if (session.callId && clerkId) {
            const channel = chatClient.channel('messaging', session.callId);
            await channel.removeMembers([clerkId]);
            console.log('[leaveSession] Removed member from Stream channel:', {
                callId: session.callId,
                clerkId,
            });
        }

        res.status(200).json({ message: 'Successfully left session' });
    } catch (error) {
        console.log("Error leaving session:", error.message);
        res.status(500).json({ message: 'Error leaving session' });
    }
}

async function endSession(req, res) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // check the user is host or not bcz only the user can end the sesion 
        if(session.host.toString() !== userId.toString()){
            return res.status(403).json({ message: 'Only the host can end the session' });
        }

        // check if the session is already completed or not
        if(session.status === 'completed') {
            return res.status(400).json({ message: 'Session is already completed' });
        }

        // delete the stream video call
        const call = streamClient.video.call('default', session.callId);
        await call.delete({hard: true});

        // delete stream chat channel
        const channel = chatClient.channel('messaging', session.callId);
        await channel.delete();

        session.status = 'completed';
        await session.save();

        res.status(200).json({ message: 'Session ended successfully' });

    } catch (error) {
        console.log("Error ending session:", error.message);
        res.status(500).json({ message: 'Error ending session' });
    }
}

export { createSession, getActiveSession, getMyRecentSessions, getSessionById, joinSession, leaveSession, endSession };