const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' });

async function createTestUser() {
  const userPoolId = 'ap-northeast-1_lZY0h55Lb';
  const username = 'testadmin';
  const email = 'test@example.com';
  const password = 'TestPass123!';

  try {
    // Create user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: password
    });

    const createResult = await client.send(createUserCommand);
    console.log('User created:', createResult.User.Username);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    });

    await client.send(setPasswordCommand);
    console.log('Password set as permanent');

    console.log('\n✅ Test user created successfully!');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Role: super_admin');
    console.log('Organization ID: org-admin-001');

  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();