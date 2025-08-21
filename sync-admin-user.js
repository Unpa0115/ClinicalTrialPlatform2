const { UserRepository } = require('./apps/backend/src/repositories/UserRepository.js');
const { RepositoryFactory } = require('./apps/backend/src/repositories/index.js');
const { createCognitoService } = require('./apps/backend/src/config/cognito.js');

async function syncAdminUser() {
  try {
    console.log('Syncing admin_user from Cognito to database...');
    
    // Initialize repositories
    const repositoryFactory = RepositoryFactory.getInstance();
    const userRepository = repositoryFactory.getUserRepository();
    
    // Sync user from Cognito
    const syncedUser = await userRepository.syncFromCognito('admin_user');
    
    if (syncedUser) {
      console.log('✅ User synchronized successfully:');
      console.log(`- User ID: ${syncedUser.userId}`);
      console.log(`- Username: ${syncedUser.username}`);
      console.log(`- Email: ${syncedUser.email}`);
      console.log(`- Role: ${syncedUser.role}`);
      console.log(`- Organization: ${syncedUser.primaryOrganizationId}`);
      console.log(`- Status: ${syncedUser.status}`);
    } else {
      console.error('❌ Failed to sync user from Cognito');
    }
    
  } catch (error) {
    console.error('❌ Error syncing user:', error.message);
    process.exit(1);
  }
}

syncAdminUser();
