import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isDevelopment = process.env.NODE_ENV === 'development';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  endpoint: isDevelopment
    ? process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
    : undefined,
  credentials: isDevelopment
    ? {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      }
    : undefined,
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
