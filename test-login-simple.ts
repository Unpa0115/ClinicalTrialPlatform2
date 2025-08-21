import { RepositoryFactory } from './apps/backend/src/repositories/index.js';

async function testUserExists() {
  try {
    console.log('Testing if admin_user exists in database...');
    
    // Initialize repositories
    const repositoryFactory = RepositoryFactory.getInstance();
    const userRepository = repositoryFactory.getUserRepository();
    
    // Check by username
    const userByUsername = await userRepository.findByUsername('admin_user');
    if (userByUsername) {
      console.log('✅ User found by username:');
      console.log(`- User ID: ${userByUsername.userId}`);
      console.log(`- Username: ${userByUsername.username}`);
      console.log(`- Email: ${userByUsername.email}`);
      console.log(`- Status: ${userByUsername.status}`);
    } else {
      console.log('❌ User NOT found by username');
    }
    
    // Check by email
    const userByEmail = await userRepository.findByEmail('admin@example.com');
    if (userByEmail) {
      console.log('✅ User found by email:');
      console.log(`- User ID: ${userByEmail.userId}`);
      console.log(`- Username: ${userByEmail.username}`);
      console.log(`- Email: ${userByEmail.email}`);
      console.log(`- Status: ${userByEmail.status}`);
    } else {
      console.log('❌ User NOT found by email');
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
  }
}

testUserExists();
