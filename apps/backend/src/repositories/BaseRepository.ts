import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  BatchWriteCommand,
  BatchGetCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { docClient, tableNames } from '../config/database.js';

/**
 * Base DynamoDB Repository class with common CRUD operations
 * Provides standardized methods for all table operations
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected docClient = docClient;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Create a new record
   */
  async create(item: T): Promise<T> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(#pk)',
        ExpressionAttributeNames: {
          '#pk': this.getPrimaryKeyName(),
        },
      });

      await docClient.send(command);
      return item;
    } catch (error) {
      console.error(`Error creating item in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Save (create or update) a record
   */
  async save(item: T): Promise<T> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
      });

      await docClient.send(command);
      return item;
    } catch (error) {
      console.error(`Error saving item in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get a record by primary key
   */
  async findById(id: string, sortKey?: string): Promise<T | null> {
    try {
      const key: any = { [this.getPrimaryKeyName()]: id };
      if (sortKey && this.getSortKeyName()) {
        key[this.getSortKeyName()!] = sortKey;
      }

      const command = new GetCommand({
        TableName: this.tableName,
        Key: key,
      });

      const result = await docClient.send(command);
      return (result.Item as T) || null;
    } catch (error) {
      console.error(`Error finding item by ID in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(id: string, updates: Partial<T>, sortKey?: string): Promise<T> {
    try {
      const key: any = { [this.getPrimaryKeyName()]: id };
      if (sortKey && this.getSortKeyName()) {
        key[this.getSortKeyName()!] = sortKey;
      }

      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([field, value], index) => {
        const nameKey = `#field${index}`;
        const valueKey = `:value${index}`;
        
        updateExpressions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = field;
        expressionAttributeValues[valueKey] = value;
      });

      // Add updatedAt timestamp
      const updatedAtKey = `#updatedAt`;
      const updatedAtValue = `:updatedAt`;
      updateExpressions.push(`${updatedAtKey} = ${updatedAtValue}`);
      expressionAttributeNames[updatedAtKey] = 'updatedAt';
      expressionAttributeValues[updatedAtValue] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const result = await docClient.send(command);
      return result.Attributes as T;
    } catch (error) {
      console.error(`Error updating item in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string, sortKey?: string): Promise<void> {
    try {
      const key: any = { [this.getPrimaryKeyName()]: id };
      if (sortKey && this.getSortKeyName()) {
        key[this.getSortKeyName()!] = sortKey;
      }

      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: key,
      });

      await docClient.send(command);
    } catch (error) {
      console.error(`Error deleting item from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Query records by partition key
   */
  async queryByPartitionKey(
    partitionKeyValue: string,
    options?: {
      sortKeyCondition?: string;
      sortKeyValue?: any;
      indexName?: string;
      limit?: number;
      exclusiveStartKey?: any;
      scanIndexForward?: boolean;
    }
  ): Promise<{ items: T[]; lastEvaluatedKey?: any }> {
    try {
      let keyConditionExpression = `#pk = :pk`;
      
      // Use the correct partition key name based on whether we're querying an index
      const partitionKeyName = options?.indexName ? 
        this.getIndexPartitionKeyName(options.indexName) : 
        this.getPrimaryKeyName();
      
      if (!partitionKeyName) {
        throw new Error(`Unable to determine partition key name for index: ${options?.indexName}`);
      }
      
      const expressionAttributeNames: Record<string, string> = {
        '#pk': partitionKeyName,
      };
      const expressionAttributeValues: Record<string, any> = {
        ':pk': partitionKeyValue,
      };

      // Add sort key condition if provided
      if (options?.sortKeyCondition && options?.sortKeyValue !== undefined) {
        const sortKeyName = options.indexName ? 
          this.getIndexSortKeyName(options.indexName) : 
          this.getSortKeyName();
        
        if (sortKeyName) {
          keyConditionExpression += ` AND #sk ${options.sortKeyCondition} :sk`;
          expressionAttributeNames['#sk'] = sortKeyName;
          expressionAttributeValues[':sk'] = options.sortKeyValue;
        }
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: options?.indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: options?.limit,
        ExclusiveStartKey: options?.exclusiveStartKey,
        ScanIndexForward: options?.scanIndexForward,
      });

      const result = await docClient.send(command);
      return {
        items: (result.Items as T[]) || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error(`Error querying ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Batch write operations (create/update/delete)
   */
  async batchWrite(operations: {
    put?: T[];
    delete?: { id: string; sortKey?: string }[];
  }): Promise<void> {
    try {
      const requestItems: any[] = [];

      // Add put requests
      if (operations.put) {
        operations.put.forEach(item => {
          requestItems.push({
            PutRequest: {
              Item: item,
            },
          });
        });
      }

      // Add delete requests
      if (operations.delete) {
        operations.delete.forEach(({ id, sortKey }) => {
          const key: any = { [this.getPrimaryKeyName()]: id };
          if (sortKey && this.getSortKeyName()) {
            key[this.getSortKeyName()!] = sortKey;
          }

          requestItems.push({
            DeleteRequest: {
              Key: key,
            },
          });
        });
      }

      // Process in batches of 25 (DynamoDB limit)
      const batchSize = 25;
      for (let i = 0; i < requestItems.length; i += batchSize) {
        const batch = requestItems.slice(i, i + batchSize);
        
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch,
          },
        });

        await docClient.send(command);
      }
    } catch (error) {
      console.error(`Error in batch write for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Batch get operations
   */
  async batchGet(keys: { id: string; sortKey?: string }[]): Promise<T[]> {
    try {
      const requestKeys = keys.map(({ id, sortKey }) => {
        const key: any = { [this.getPrimaryKeyName()]: id };
        if (sortKey && this.getSortKeyName()) {
          key[this.getSortKeyName()!] = sortKey;
        }
        return key;
      });

      const results: T[] = [];
      const batchSize = 100; // DynamoDB limit

      for (let i = 0; i < requestKeys.length; i += batchSize) {
        const batch = requestKeys.slice(i, i + batchSize);
        
        const command = new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch,
            },
          },
        });

        const result = await docClient.send(command);
        if (result.Responses?.[this.tableName]) {
          results.push(...(result.Responses[this.tableName] as T[]));
        }
      }

      return results;
    } catch (error) {
      console.error(`Error in batch get for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Scan all records (use with caution)
   */
  async scanAll(options?: {
    limit?: number;
    exclusiveStartKey?: any;
    filterExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
  }): Promise<{ items: T[]; lastEvaluatedKey?: any }> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        Limit: options?.limit,
        ExclusiveStartKey: options?.exclusiveStartKey,
        FilterExpression: options?.filterExpression,
        ExpressionAttributeNames: options?.expressionAttributeNames,
        ExpressionAttributeValues: options?.expressionAttributeValues,
      });

      const result = await docClient.send(command);
      return {
        items: (result.Items as T[]) || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error(`Error scanning ${this.tableName}:`, error);
      throw error;
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract getPrimaryKeyName(): string;
  protected abstract getSortKeyName(): string | null;
  protected abstract getIndexPartitionKeyName(indexName: string): string | null;
  protected abstract getIndexSortKeyName(indexName: string): string | null;
}