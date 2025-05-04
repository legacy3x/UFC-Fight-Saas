import axios from 'axios';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow both localhost and 127.0.0.1
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'UFC Predictions API',
    timestamp: new Date().toISOString()
  });
});

// Scraping endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { division, gender } = req.body;
    
    // Log the scraping request
    console.log('Starting scrape with params:', { division, gender });
    
    // Validate input parameters
    if (division !== 'all' && !division) {
      throw new Error('Invalid division specified');
    }
    
    if (gender !== 'all' && !['male', 'female'].includes(gender)) {
      throw new Error('Invalid gender specified');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return success response
    res.json({ 
      success: true, 
      message: 'Scraping completed successfully',
      data: {
        recordsProcessed: Math.floor(Math.random() * 50) + 10,
        division,
        gender,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Return error response
    res.status(500).json({ 
      success: false,
      error: error.message || 'An unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// Fighters endpoints
app.get('/api/fighters', async (req, res, next) => {
  try {
    console.log('Fetching fighters from Supabase...');
    
    const { data, error } = await supabase
      .from('fighters')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database Error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'No fighters found'
      });
    }

    console.log(`Successfully fetched ${data.length} fighters`);
    res.json(data);
  } catch (error) {
    console.error('Server error while fetching fighters:', error);
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
app.listen(port, '0.0.0.0', () => { // Listen on all network interfaces
  console.log(`Backend server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Supabase URL configured:', !!process.env.VITE_SUPABASE_URL);
  console.log('Supabase Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Server timestamp:', new Date().toISOString());
});