import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  CreateTableCommand, 
  DescribeTableCommand, 
  UpdateTimeToLiveCommand,
  TimeToLiveSpecification 
} from '@aws-sdk/client-dynamodb';
import { tableDefinitions } from './table-definitions';

// DynamoDB Table Creation Script
// Creates all 16 tables for the Clinical Trial Platform

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // For local development
});

async function createTable(tableDefinition: any): Promise<void> {
  try {
    console.log(`Creating table: ${tableDefinition.TableName}`);
    
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ 
        TableName: tableDefinition.TableName 
      }));
      console.log(`Table ${tableDefinition.TableName} already exists, skipping...`);
      return;
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, proceed with creation
    }

    const command = new CreateTableCommand(tableDefinition);
    const result = await client.send(command);
    
    console.log(`✅ Table ${tableDefinition.TableName} created successfully`);
    console.log(`   Status: ${result.TableDescription?.TableStatus}`);
    
    // Wait for table to become active
    await waitForTableActive(tableDefinition.TableName);
    
  } catch (error) {
    console.error(`❌ Error creating table ${tableDefinition.TableName}:`, error);
    throw error;
  }
}

async function waitForTableActive(tableName: string): Promise<void> {
  console.log(`Waiting for table ${tableName} to become active...`);
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max wait time
  
  while (attempts < maxAttempts) {
    try {
      const result = await client.send(new DescribeTableCommand({ 
        TableName: tableName 
      }));
      
      if (result.Table?.TableStatus === 'ACTIVE') {
        console.log(`✅ Table ${tableName} is now active`);
        return;
      }
      
      console.log(`   Table ${tableName} status: ${result.Table?.TableStatus}`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
      
    } catch (error) {
      console.error(`Error checking table status for ${tableName}:`, error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  throw new Error(`Table ${tableName} did not become active within timeout period`);
}

async function configureTTL(): Promise<void> {
  console.log('Configuring TTL for DraftData table...');
  
  try {
    const ttlSpec: TimeToLiveSpecification = {
      AttributeName: 'ttl',
      Enabled: true,
    };
    
    const environment = process.env.ENVIRONMENT || 'dev';
    const tableName = `${environment}-DraftData`;
    
    const command = new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: ttlSpec,
    });
    
    await client.send(command);
    console.log('✅ TTL configured for DraftData table (30 days)');
    
  } catch (error) {
    console.error('❌ Error configuring TTL:', error);
    throw error;
  }
}

async function createAllTables(): Promise<void> {
  console.log('🚀 Starting DynamoDB table creation...');
  console.log(`Creating ${tableDefinitions.length} tables for Clinical Trial Platform`);
  console.log('');
  
  try {
    // Create all tables
    for (const tableDefinition of tableDefinitions) {
      await createTable(tableDefinition);
      console.log(''); // Add spacing between tables
    }
    
    // Configure TTL for DraftData table
    await configureTTL();
    
    console.log('🎉 All tables created successfully!');
    console.log('');
    console.log('Created tables:');
    tableDefinitions.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TableName}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    process.exit(1);
  }
}

// Run the script when executed directly
createAllTables()
  .then(() => {
    console.log('✅ Table creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Table creation failed:', error);
    process.exit(1);
  });

export { createAllTables, createTable, configureTTL };