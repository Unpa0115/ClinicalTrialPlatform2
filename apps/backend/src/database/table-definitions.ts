import { CreateTableCommand, CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

// DynamoDB Table Definitions for Clinical Trial Platform
// Based on validated mockups and refined requirements

// Get environment prefix
const environment = process.env.ENVIRONMENT || 'dev';
const getTableName = (baseName: string): string => {
  return `${environment}-${baseName}`;
};

export const tableDefinitions: CreateTableCommandInput[] = [
  // 1. ClinicalStudy Table
  {
    TableName: getTableName('ClinicalStudy'),
    KeySchema: [
      {
        AttributeName: 'clinicalStudyId',
        KeyType: 'HASH', // Partition key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'clinicalStudyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'entityType',
        AttributeType: 'S',
      },
      {
        AttributeName: 'status',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EntityTypeIndex',
        KeySchema: [
          {
            AttributeName: 'entityType',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'status',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 2. Organizations Table
  {
    TableName: getTableName('Organizations'),
    KeySchema: [
      {
        AttributeName: 'organizationId',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'organizationId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'entityType',
        AttributeType: 'S',
      },
      {
        AttributeName: 'status',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EntityTypeIndex',
        KeySchema: [
          {
            AttributeName: 'entityType',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'status',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 3. Users Table
  {
    TableName: getTableName('Users'),
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'username',
        AttributeType: 'S',
      },
      {
        AttributeName: 'cognitoSub',
        AttributeType: 'S',
      },
      {
        AttributeName: 'primaryOrganizationId',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UsernameIndex',
        KeySchema: [
          {
            AttributeName: 'username',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'CognitoSubIndex',
        KeySchema: [
          {
            AttributeName: 'cognitoSub',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'OrganizationIndex',
        KeySchema: [
          {
            AttributeName: 'primaryOrganizationId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 4. Patients Table
  {
    TableName: getTableName('Patients'),
    KeySchema: [
      {
        AttributeName: 'patientId',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'patientId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'registeredOrganizationId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'patientCode',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'OrganizationIndex',
        KeySchema: [
          {
            AttributeName: 'registeredOrganizationId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'patientCode',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 5. Surveys Table
  {
    TableName: getTableName('Surveys'),
    KeySchema: [
      {
        AttributeName: 'surveyId',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'clinicalStudyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'organizationId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'patientId',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudyIndex',
        KeySchema: [
          {
            AttributeName: 'clinicalStudyId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'OrganizationIndex',
        KeySchema: [
          {
            AttributeName: 'organizationId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'PatientIndex',
        KeySchema: [
          {
            AttributeName: 'patientId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 6. Visits Table
  {
    TableName: getTableName('Visits'),
    KeySchema: [
      {
        AttributeName: 'surveyId',
        KeyType: 'HASH', // Partition key
      },
      {
        AttributeName: 'visitId',
        KeyType: 'RANGE', // Sort key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'clinicalStudyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'organizationId',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudyIndex',
        KeySchema: [
          {
            AttributeName: 'clinicalStudyId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'OrganizationIndex',
        KeySchema: [
          {
            AttributeName: 'organizationId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 7. BasicInfo Table (基礎情報)
  {
    TableName: getTableName('BasicInfo'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'basicInfoId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'basicInfoId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 8. VAS Table (Visual Analog Scale)
  {
    TableName: getTableName('VAS'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'vasId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'vasId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 9. ComparativeScores Table (相対評価)
  {
    TableName: getTableName('ComparativeScores'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'comparativeScoresId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'comparativeScoresId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 10. LensFluidSurfaceAssessment Table (フィッティング・涙濡れ性検査)
  {
    TableName: getTableName('LensFluidSurfaceAssessment'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'fittingId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'fittingId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 11. DR1 Table (涙液層検査)
  {
    TableName: getTableName('DR1'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'dr1Id',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'dr1Id',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 12. CorrectedVA Table (矯正視力検査)
  {
    TableName: getTableName('CorrectedVA'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'correctedVAId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'correctedVAId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 13. LensInspection Table (レンズ検査)
  {
    TableName: getTableName('LensInspection'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'lensInspectionId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'lensInspectionId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 14. Questionnaire Table (問診)
  {
    TableName: getTableName('Questionnaire'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'questionnaireId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'questionnaireId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'surveyId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'eyeside',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SurveyIndex',
        KeySchema: [
          {
            AttributeName: 'surveyId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'eyeside',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 15. AuditLog Table (監査ログ)
  {
    TableName: getTableName('AuditLog'),
    KeySchema: [
      {
        AttributeName: 'logId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'timestamp',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'logId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'timestamp',
        AttributeType: 'S',
      },
      {
        AttributeName: 'userId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'targetType',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'TargetTypeIndex',
        KeySchema: [
          {
            AttributeName: 'targetType',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // 16. DraftData Table (統合下書き管理) - with TTL
  {
    TableName: getTableName('DraftData'),
    KeySchema: [
      {
        AttributeName: 'visitId',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'draftId',
        KeyType: 'RANGE',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'visitId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'draftId',
        AttributeType: 'S',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    // TTL will be configured separately after table creation
  },
];