import express from 'express';
import path from 'path';
import cors from 'cors';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express'

import { ENV } from './src/lib/config.js';
import connectDB from './src/lib/db.js';
import inngest, { syncUser, deleteUserFromDB } from './src/lib/inngest.js';
import chatRoutes from './src/routes/chatRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import executeRoutes from './src/routes/executeRoutes.js'

const app = express();
const PORT = ENV.PORT || 3000;


const __dirname = path.resolve();

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

    app.get((req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    });
}

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('💥 Error in starting the server:', error);
    }
};

startServer();
