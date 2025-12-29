require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const database = require('./config/database');
const { errorHandler } = require('./middleware/error.middleware');

// Import routes
const paymentRoutes = require('./routes/payment.routes');
const aftersaleRoutes = require('./routes/aftersale.routes');
const assemblyRoutes = require('./routes/assembly.routes');

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(
  cors(config.cors)
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
if (config.nodeEnv !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'payment-after-sale-service',
    timestamp: new Date().toISOString(),
    database: database.pool ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/aftersale', aftersaleRoutes);
app.use('/api/assembly', assemblyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Payment & After-Sale Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await database.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await database.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

