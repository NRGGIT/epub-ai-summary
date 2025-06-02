import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { uploadRouter } from './routes/upload';
import { booksRouter } from './routes/books';
import { configRouter } from './routes/config';
import { summarizeRouter } from './routes/summarize';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads and data directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir = path.join(__dirname, '../data');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(dataDir);

// Serve static files (images from EPUBs)
app.use('/static', express.static(uploadsDir));

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/books', booksRouter);
app.use('/api/config', configRouter);
app.use('/api/summarize', summarizeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
