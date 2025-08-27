import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import clinicalStudiesRoutes from './routes/clinicalStudies.js';
import organizationsRoutes from './routes/organizations.js';
import patientsRoutes from './routes/patients.js';
import surveyRoutes from './routes/surveyRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import examinationRoutes from './routes/examinationRoutes.js';

// Try to load .env from current directory, then parent directories
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Debug: Check if Cognito environment variables are loaded
console.log('Environment variables check:');
console.log('COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID ? 'SET' : 'MISSING');
console.log('COGNITO_BACKEND_CLIENT_ID:', process.env.COGNITO_BACKEND_CLIENT_ID ? 'SET' : 'MISSING');
console.log('Working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Clinical Trial Platform API' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Clinical Studies routes
app.use('/api/clinical-studies', clinicalStudiesRoutes);

// Organizations routes
app.use('/api/organizations', organizationsRoutes);

// Patients routes
app.use('/api/patients', patientsRoutes);

// Survey routes
app.use('/api/surveys', surveyRoutes);

// Visit routes
app.use('/api/visits', visitRoutes);

// Examination routes
app.use('/api/examinations', examinationRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
