import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import kitchenRoutes from './routes/kitchen.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use(limiter);

// Attach io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Tablify API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kitchen', kitchenRoutes);

// Socket.IO
setupSocketIO(io);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const isTest = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

if (!isTest) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Tablify Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
}


export default app;
