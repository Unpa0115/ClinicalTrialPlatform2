const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-1'
});

const docClient = DynamoDBDocumentClient.from(client);

async function updateUserPermissions() {
  try {
    // Get the current user record
    const getCommand = new GetCommand({
      TableName: 'dev-Users',
      Key: {
        userId: 'user-admin_user-1755485242032'
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      console.error('❌ User not found');
      return;
    }

    console.log('📋 Current user record:', result.Item);

    // Update with permissions
    const updateCommand = new UpdateCommand({
      TableName: 'dev-Users',
      Key: {
        userId: 'user-admin_user-1755485242032'
      },
      UpdateExpression: 'SET #permissions = :permissions, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#permissions': 'permissions'
      },
      ExpressionAttributeValues: {
        ':permissions': ['*'], // Super admin permissions
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    console.log('✅ User permissions updated successfully!');
    console.log('📋 Updated user record:', updateResult.Attributes);

  } catch (error) {
    console.error('❌ Error updating user permissions:', error);
  }
}

updateUserPermissions();