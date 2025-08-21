import { createCognitoService } from './apps/backend/src/config/cognito.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/backend/.env' });

async function debugCreateUser() {
  console.log('🔍 Debugging user creation...');
  
  // Check environment variables
  console.log('Environment check:');
  console.log('COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID ? 'SET' : 'MISSING');
  console.log('COGNITO_BACKEND_CLIENT_ID:', process.env.COGNITO_BACKEND_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('AWS_REGION:', process.env.AWS_REGION);
  
  if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_BACKEND_CLIENT_ID) {
    console.error('❌ Missing required Cognito environment variables');
    process.exit(1);
  }
  
  try {
    const cognitoService = createCognitoService();
    
    // Check if user already exists
    try {
      const existingUser = await cognitoService.getUser('admin@example.com');
      console.log('✅ User already exists:', existingUser);
      return;
    } catch (error) {
      console.log('ℹ️  User does not exist, creating...');
    }
    
    // Create user
    const username = await cognitoService.createUser({
      username: 'admin@example.com',
      email: 'admin@example.com',
      temporaryPassword: 'TempPass123!',
      attributes: {
        given_name: 'Admin',
        family_name: 'User',
        'custom:role': 'super_admin'
      },
      groups: ['super_admin']
    });
    
    console.log('✅ User created:', username);
    
    // Set permanent password
    await cognitoService.setUserPassword('admin@example.com', 'TempPass123!', true);
    console.log('✅ Password set');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCreateUser();