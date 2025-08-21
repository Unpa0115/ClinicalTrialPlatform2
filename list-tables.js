const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-1' });

async function listTables() {
  try {
    const command = new ListTablesCommand({});
    const result = await client.send(command);
    
    console.log('DynamoDB Tables:');
    result.TableNames?.forEach(tableName => {
      console.log(`  - ${tableName}`);
    });
    
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listTables();