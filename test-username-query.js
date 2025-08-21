const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function testUsernameQuery() {
  try {
    console.log('Testing username query against GSI...');
    
    const queryCommand = new QueryCommand({
      TableName: 'dev-Users',
      IndexName: 'UsernameIndex',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': 'admin_user'
      }
    });
    
    const result = await docClient.send(queryCommand);
    console.log('Query result:', result.Count, 'items found');
    
    result.Items?.forEach(user => {
      console.log('Found user:', {
        userId: user.userId,
        username: user.username,
        email: user.email,
        status: user.status
      });
    });
    
  } catch (error) {
    console.error('Error querying username index:', error);
    
    // Fallback: try scanning for the user
    console.log('Trying scan as fallback...');
    
    try {
      const scanCommand = new QueryCommand({
        TableName: 'dev-Users',
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': 'admin_user'
        }
      });
      
      const scanResult = await docClient.send(scanCommand);
      console.log('Scan result:', scanResult.Count, 'items found');
      
    } catch (scanError) {
      console.error('Scan also failed:', scanError);
    }
  }
}

testUsernameQuery();