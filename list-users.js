const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' });

async function listUsers() {
  const userPoolId = 'ap-northeast-1_lZY0h55Lb';

  try {
    const command = new ListUsersCommand({
      UserPoolId: userPoolId
    });

    const result = await client.send(command);
    
    console.log('Users in the pool:');
    result.Users?.forEach(user => {
      console.log(`\nUsername: ${user.Username}`);
      console.log(`User Status: ${user.UserStatus}`);
      console.log('Attributes:');
      user.Attributes?.forEach(attr => {
        console.log(`  ${attr.Name}: ${attr.Value}`);
      });
    });

  } catch (error) {
    console.error('Error listing users:', error);
  }
}

listUsers();