import express from 'express';
import path from 'path';
import cors from 'cors';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express'
import http from "http";
import { Server } from "socket.io";

import { ENV } from './src/lib/config.js';
import connectDB from './src/lib/db.js';
import inngest, { syncUser, deleteUserFromDB } from './src/lib/inngest.js';
import chatRoutes from './src/routes/chatRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import executeRoutes from './src/routes/executeRoutes.js'

const app = express();
const server = http.createServer(app);
const PORT = ENV.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const sessionEditorState = new Map();

io.on('connection', (socket) => {
  socket.on('join-session', ({ sessionId }) => {
    if (!sessionId) return;
    socket.join(sessionId);

    const currentState = sessionEditorState.get(sessionId);
    if (currentState) {
      socket.emit('session-state', currentState);
    }
  });

  socket.on('editor-sync', ({ sessionId, senderId, code, language, output, isRunning }) => {
    if (!sessionId) return;

    const prev = sessionEditorState.get(sessionId) || {};
    const updated = {
      code: typeof code === 'string' ? code : prev.code,
      language: typeof language === 'string' ? language : prev.language,
      output: output !== undefined ? output : prev.output,
      isRunning: typeof isRunning === 'boolean' ? isRunning : prev.isRunning,
    };

    sessionEditorState.set(sessionId, updated);

    socket.to(sessionId).emit('editor-sync', {
      senderId,
      code: updated.code,
      language: updated.language,
      output: updated.output,
      isRunning: updated.isRunning,
    });
  });

  socket.on('end-session', ({ sessionId }) => {
    if (!sessionId) return;
    sessionEditorState.delete(sessionId);
    io.to(sessionId).emit('session-ended');
  });
});


const __dirname = path.resolve();

app.use((req, res, next) => {
    console.log('[REQ]', req.method, req.originalUrl);
    next();
});

// middleware
app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

app.use("/api/inngest", (req, res, next) => {
  console.log("Incoming request to /api/inngest");
  next();
});

app.use('/api/inngest',
    serve({
    client: inngest,
    functions: [syncUser, deleteUserFromDB],
  })
);

app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/execute', executeRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ message: 'successs from backend API' });
});


// make our app ready for deployment
if(ENV.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'frontend/dist')));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    });
}

app.use((req, res) => {
    console.log('[UNMATCHED ROUTE]', {
        method: req.method,
        originalUrl: req.originalUrl,
        url: req.url,
    });
    res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
});

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('💥 Error in starting the server:', error);
    }
};

startServer();
