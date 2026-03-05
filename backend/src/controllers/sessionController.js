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
        const callId = `session_${Date.now()}_${Math.random().toString(36).substr(7)}`;

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
            return res.status(400).json({ message: 'Session is already full' });
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

        session.status = 'completed';
        await session.save();

        // delete the stream video call
        const call = streamClient.video.call('default', session.callId);
        await call.delete({hard: true});

        // delete stream chat channel
        const channel = chatClient.channel('messaging', session.callId);
        await channel.delete();

        res.status(200).json({ message: 'Session ended successfully' });

    } catch (error) {
        console.log("Error ending session:", error.message);
        res.status(500).json({ message: 'Error ending session' });
    }
}

export { createSession, getActiveSession, getMyRecentSessions, getSessionById, joinSession, endSession };