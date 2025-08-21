const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-1'
});

const docClient = DynamoDBDocumentClient.from(client);

async function createTestOrganization() {
  try {
    // Create test organization
    const organization = {
      organizationId: 'org-admin-001',
      organizationName: 'Test Hospital',
      organizationCode: 'admin',
      organizationType: 'hospital',
      address: {
        country: 'Japan',
        prefecture: 'Tokyo',
        city: 'Shibuya',
        addressLine1: '1-1-1 Test Street',
        postalCode: '150-0001'
      },
      phoneNumber: '03-1234-5678',
      email: 'contact@testhospital.com',
      principalInvestigator: 'Dr. Test',
      studyCoordinator: 'Coordinator Test',
      contactPerson: 'Contact Test',
      maxPatientCapacity: 100,
      availableEquipment: ['CT', 'MRI'],
      certifications: ['ISO9001'],
      status: 'active',
      entityType: 'organization',
      activeStudies: [],
      createdBy: 'system',
      lastModifiedBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: 'dev-Organizations',
      Item: organization
    });

    await docClient.send(command);
    console.log('✅ Test organization created successfully!');
    console.log('Organization:', JSON.stringify(organization, null, 2));

  } catch (error) {
    console.error('❌ Error creating test organization:', error);
  }
}

createTestOrganization();