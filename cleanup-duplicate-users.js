const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function cleanupDuplicateUsers() {
  try {
    console.log('Finding duplicate admin_user records...');
    
    const scanCommand = new ScanCommand({
      TableName: 'dev-Users',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': 'admin_user'
      }
    });
    
    const result = await docClient.send(scanCommand);
    console.log('Found', result.Count, 'admin_user records');
    
    if (result.Count > 1) {
      // Keep the newest one, delete the rest
      const users = result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toDelete = users.slice(1); // Keep the first (newest), delete the rest
      
      for (const user of toDelete) {
        console.log('Deleting duplicate user:', user.userId);
        
        const deleteCommand = new DeleteCommand({
          TableName: 'dev-Users',
          Key: {
            userId: user.userId
          }
        });
        
        await docClient.send(deleteCommand);
        console.log('Deleted:', user.userId);
      }
      
      console.log('✅ Cleanup completed. Kept the newest admin_user record.');
    } else {
      console.log('No duplicates found.');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDuplicateUsers();