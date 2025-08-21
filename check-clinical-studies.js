const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const docClient = DynamoDBDocumentClient.from(client);

async function checkClinicalStudies() {
  try {
    console.log('Checking clinical studies in DynamoDB...');
    
    const scanCommand = new ScanCommand({
      TableName: 'dev-ClinicalStudy'
    });
    
    const result = await docClient.send(scanCommand);
    console.log('Found', result.Count, 'clinical studies');
    
    result.Items?.forEach(study => {
      console.log('\n--- Study ---');
      console.log('clinicalStudyId:', study.clinicalStudyId);
      console.log('studyCode:', study.studyCode);
      console.log('studyName:', study.studyName);
      console.log('status:', study.status);
      console.log('createdAt:', study.createdAt);
      console.log('updatedAt:', study.updatedAt);
    });
    
  } catch (error) {
    console.error('Error checking clinical studies:', error);
  }
}

checkClinicalStudies();