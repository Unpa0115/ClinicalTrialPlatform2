const { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

const client = new CognitoIdentityProviderClient({ 
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

async function resetPassword() {
  try {
    console.log('Resetting password for admin@example.com...');
    
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: 'admin_user',
      Password: 'TempPass123!',
      Permanent: true
    });
    
    await client.send(command);
    console.log('✅ Password reset successful!');
    console.log('Login credentials:');
    console.log('  Username: admin@example.com');
    console.log('  Password: TempPass123!');
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  }
}

resetPassword();