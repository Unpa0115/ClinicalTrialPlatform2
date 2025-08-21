import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isDevelopment = process.env.NODE_ENV === 'development';

const region = process.env.AWS_REGION || 'ap-northeast-1';

// DEBUG: Log the actual configuration being used
console.log('DynamoDB Configuration:');
console.log('AWS_REGION:', region);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ENVIRONMENT:', process.env.ENVIRONMENT);

const client = new DynamoDBClient({
  region: 'ap-northeast-1', // Hardcode for testing
  // Remove local DynamoDB endpoint to use AWS DynamoDB
  // endpoint: isDevelopment
  //   ? process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
  //   : undefined,
  // credentials: isDevelopment
  //   ? {
  //       accessKeyId: 'dummy',
  //       secretAccessKey: 'dummy',
  //     }
  //   : undefined,
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export { client as dynamoClient };

// Table names configuration with environment prefix support
const environment = process.env.ENVIRONMENT || 'dev';
const getTableName = (baseName: string): string => {
  // Always use the environment prefix for CloudFormation-created tables
  const tableName = `${environment}-${baseName}`;
  console.log(`Generated table name for ${baseName}: ${tableName}`);
  return tableName;
};

export const tableNames = {
  // Core management tables
  clinicalStudy: getTableName('ClinicalStudy'),
  organizations: getTableName('Organizations'),
  users: getTableName('Users'),
  patients: getTableName('Patients'),
  surveys: getTableName('Surveys'),
  visits: getTableName('Visits'),
  
  // Examination data tables (8 types) - with standardized Eyeside field
  basicInfo: getTableName('BasicInfo'),
  vas: getTableName('VAS'),
  comparativeScores: getTableName('ComparativeScores'),
  lensFluidSurfaceAssessment: getTableName('LensFluidSurfaceAssessment'),
  dr1: getTableName('DR1'),
  correctedVA: getTableName('CorrectedVA'),
  lensInspection: getTableName('LensInspection'),
  questionnaire: getTableName('Questionnaire'),
  
  // System tables
  auditLog: getTableName('AuditLog'),
  draftData: getTableName('DraftData'), // TTL configured for 30 days
};

// Index names
export const indexNames = {
  entityTypeIndex: 'EntityTypeIndex',
  usernameIndex: 'UsernameIndex',
  organizationIndex: 'OrganizationIndex',
  studyIndex: 'StudyIndex',
  patientIndex: 'PatientIndex',
  surveyIndex: 'SurveyIndex',
  userIndex: 'UserIndex',
  targetTypeIndex: 'TargetTypeIndex',
};
