import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './src/lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


const __dirname = path.resolve();

app.get('/health', (req, res) => {
    res.status(200).json({ message: 'successs from backend API' });
});

app.get('/books', (req, res) => {
    res.status(200).json({ message: 'this is the books endpoint' });
});

// make our app ready for deployment
if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('/{*any}', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
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