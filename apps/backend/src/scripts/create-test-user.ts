import { createCognitoService } from '../config/cognito.js';
import { RepositoryFactory } from '../repositories/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

async function createTestUser() {
  console.log('Creating test user in Cognito and DynamoDB...');
  
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
    const userRepository = RepositoryFactory.getInstance().getUserRepository();
    
    const testUser = {
      username: 'admin@example.com',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      title: 'System Administrator',
      primaryOrganizationId: 'org-main-001',
      role: 'super_admin' as const,
      temporaryPassword: 'TempPass123!',
      language: 'ja' as const,
      timezone: 'Asia/Tokyo'
    };

    console.log('Creating user in Cognito and DynamoDB...');
    
    try {
      // Try to create user - this will handle both Cognito and DynamoDB
      const createdUser = await userRepository.createUserWithCognito(testUser, 'system');
      console.log('✅ Test user created successfully!');
      console.log('User details:', {
        userId: createdUser.userId,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status
      });
    } catch (error: any) {
      if (error.message?.includes('UsernameExistsException')) {
        console.log('ℹ️  User already exists in Cognito');
        
        // Try to sync from Cognito
        try {
          const syncedUser = await userRepository.syncFromCognito(testUser.username);
          if (syncedUser) {
            console.log('✅ User synced from Cognito successfully!');
          } else {
            console.log('⚠️  User exists in Cognito but not in DynamoDB, creating DynamoDB record...');
            // Create only DynamoDB record
            const cognitoUser = await cognitoService.getUser(testUser.username);
            const userRecord = {
              ...testUser,
              cognitoSub: cognitoUser.attributes?.sub || 'unknown',
              displayName: `${testUser.firstName} ${testUser.lastName}`,
              accessibleOrganizations: [testUser.primaryOrganizationId],
              permissions: ['*'],
              cognitoGroups: [testUser.role],
              accessibleStudies: [],
              status: 'active' as const,
              createdBy: 'system',
              lastModifiedBy: 'system',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              entityType: 'user' as const,
              userId: `user-${testUser.username}-${Date.now()}`
            };
            
            await userRepository.save(userRecord);
            console.log('✅ DynamoDB user record created!');
          }
        } catch (syncError) {
          console.error('❌ Error syncing user:', syncError);
        }
      } else {
        throw error;
      }
    }

    // Set permanent password
    console.log('Setting permanent password...');
    try {
      await cognitoService.setUserPassword(testUser.username, 'TempPass123!', true);
      console.log('✅ Password set successfully!');
    } catch (passwordError) {
      console.log('ℹ️  Password may already be set');
    }

    // Add user to super_admin group
    console.log('Adding user to super_admin group...');
    try {
      await cognitoService.addUserToGroups(testUser.username, ['super_admin']);
      console.log('✅ User added to super_admin group!');
    } catch (groupError) {
      console.log('ℹ️  User may already be in the group');
    }

    console.log('\n🎉 Test user setup completed!');
    console.log('Login credentials:');
    console.log('  Username: admin@example.com');
    console.log('  Password: TempPass123!');
    console.log('  Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser();
}

export { createTestUser };