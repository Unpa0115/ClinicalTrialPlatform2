const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-1'
});

const docClient = DynamoDBDocumentClient.from(client);

async function createUserRecord() {
  try {
    // Create user record for admin_user
    const userRecord = {
      userId: 'user-admin_user-' + Date.now(),
      username: 'admin_user',
      email: 'admin@example.com',
      cognitoSub: '47e4ea58-4011-703b-84b2-d39c316c01ff', // From the Cognito user list
      firstName: 'system',
      lastName: 'administrater',
      displayName: 'system_admin',
      title: 'System Administrator',
      department: 'IT',
      primaryOrganizationId: 'org-admin-001',
      accessibleOrganizations: ['org-admin-001'],
      role: 'super_admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: 'dev-Users',
      Item: userRecord
    });

    await docClient.send(command);
    console.log('✅ User record created successfully!');
    console.log('User record:', JSON.stringify(userRecord, null, 2));

  } catch (error) {
    console.error('❌ Error creating user record:', error);
  }
}

createUserRecord();