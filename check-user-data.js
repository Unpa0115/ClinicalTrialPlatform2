const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function checkUserData() {
  try {
    console.log('Checking user data in DynamoDB...');
    
    const scanCommand = new ScanCommand({
      TableName: 'dev-Users'
    });
    
    const result = await docClient.send(scanCommand);
    console.log('Found users:', result.Count);
    
    result.Items?.forEach(user => {
      console.log('\n--- User ---');
      console.log('userId:', user.userId);
      console.log('username:', user.username);
      console.log('email:', user.email);
      console.log('cognitoSub:', user.cognitoSub);
      console.log('status:', user.status);
      console.log('role:', user.role);
    });
    
  } catch (error) {
    console.error('Error checking user data:', error);
  }
}

checkUserData();