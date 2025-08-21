const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

console.log('Testing Cognito connection...');
console.log('COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID);
console.log('AWS_REGION:', process.env.AWS_REGION);

const client = new CognitoIdentityProviderClient({ 
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

async function testCognito() {
  try {
    const command = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 10
    });
    
    const result = await client.send(command);
    console.log('✅ Cognito connection successful!');
    console.log('Users found:', result.Users?.length || 0);
    
    if (result.Users && result.Users.length > 0) {
      result.Users.forEach(user => {
        console.log(`\n- Username: ${user.Username}`);
        console.log(`  Status: ${user.UserStatus}`);
        console.log(`  Email: ${user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'N/A'}`);
        console.log(`  Groups: ${user.Attributes?.find(attr => attr.Name === 'cognito:groups')?.Value || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('❌ Cognito connection failed:', error.message);
  }
}

testCognito();