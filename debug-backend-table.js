// Use exact same configuration as backend
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: './apps/backend/.env' });

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environment = process.env.ENVIRONMENT || 'dev';

console.log('Region:', region);
console.log('Environment:', environment);
console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function debugBackendTable() {
  const tableName = `${environment}-Users`;
  console.log('Table name:', tableName);
  
  try {
    console.log('Testing query against backend table...');
    
    const queryCommand = new QueryCommand({
      TableName: tableName,
      IndexName: 'UsernameIndex',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': 'admin_user'
      }
    });
    
    const result = await docClient.send(queryCommand);
    console.log('✅ Query successful!', result.Count, 'items found');
    
    result.Items?.forEach(user => {
      console.log('Found user:', {
        userId: user.userId,
        username: user.username,
        email: user.email,
        status: user.status,
        cognitoSub: user.cognitoSub
      });
    });
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    
    // Try listing the table to see if it exists
    try {
      const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');
      const listCommand = new ListTablesCommand({});
      const listResult = await client.send(listCommand);
      
      console.log('\nAvailable tables:');
      listResult.TableNames?.forEach(name => {
        if (name.includes('Users') || name.includes('users')) {
          console.log(`  - ${name} ${name === tableName ? '✅ (TARGET)' : ''}`);
        }
      });
      
    } catch (listError) {
      console.error('❌ Could not list tables:', listError.message);
    }
  }
}

debugBackendTable();