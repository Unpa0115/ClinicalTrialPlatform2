const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' });

async function updateTestUser() {
  const userPoolId = 'ap-northeast-1_lZY0h55Lb';
  const username = 'admin'; // admin@example.com のusernameはadmin

  try {
    // First, let's see the current user attributes
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username
    });

    const userResult = await client.send(getUserCommand);
    console.log('Current user attributes:');
    userResult.UserAttributes?.forEach(attr => {
      console.log(`  ${attr.Name}: ${attr.Value}`);
    });

    // Update user attributes
    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'custom:role', Value: 'super_admin' },
        { Name: 'custom:organization_id', Value: 'org-admin-001' }
      ]
    });

    await client.send(updateCommand);
    console.log('\n✅ User attributes updated successfully!');

    // Verify the update
    const updatedUserResult = await client.send(getUserCommand);
    console.log('\nUpdated user attributes:');
    updatedUserResult.UserAttributes?.forEach(attr => {
      console.log(`  ${attr.Name}: ${attr.Value}`);
    });

  } catch (error) {
    console.error('Error updating test user:', error);
    
    if (error.name === 'InvalidParameterException') {
      console.log('\n❌ Custom attributes are not configured in the User Pool.');
      console.log('You need to add custom attributes in the AWS Cognito Console:');
      console.log('1. Go to AWS Cognito Console');
      console.log('2. Select your User Pool');
      console.log('3. Go to "Sign-up experience" > "Attributes"');
      console.log('4. Add custom attributes: "role" and "organizationId"');
    }
  }
}

updateTestUser();