import { BaseRepository } from './BaseRepository.js';
import { createCognitoService, CognitoService, CreateUserRequest, UpdateUserRequest } from '../config/cognito.js';
import { QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { tableNames } from '../config/database.js';

export interface UserRecord {
  // Partition Key
  userId: string; // "user-{username}-{timestamp}"
  
  // User Identity
  username: string; // ユーザー名（ログイン用）
  email: string; // メールアドレス
  cognitoSub: string; // Cognito User ID (sub claim)
  
  // Personal Information
  firstName: string; // 名
  lastName: string; // 姓
  displayName: string; // 表示名
  
  // Professional Information
  title: string; // 職位
  department?: string; // 部署
  specialization?: string; // 専門分野
  licenseNumber?: string; // 医師免許番号等
  
  // Organization Association
  primaryOrganizationId: string; // 主所属組織
  accessibleOrganizations: string[]; // アクセス可能組織リスト
  
  // Role and Permissions (synced with Cognito Groups)
  role: 'super_admin' | 'study_admin' | 'org_admin' | 'investigator' | 'coordinator' | 'data_entry' | 'viewer';
  permissions: string[]; // 詳細権限リスト
  cognitoGroups: string[]; // Cognito Groups (synced from Cognito)
  
  // Study Access
  accessibleStudies: string[]; // アクセス可能な臨床試験IDリスト
  
  // Account Status (synced with Cognito)
  status: 'active' | 'inactive' | 'pending_activation' | 'suspended' | 'locked';
  lastLoginAt?: string; // 最終ログイン日時
  
  // Preferences
  language: 'ja' | 'en'; // 言語設定
  timezone: string; // タイムゾーン
  
  // Metadata
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  
  // GSI for login
  entityType: 'user'; // GSI partition key
}

export interface CreateUserWithCognitoRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  primaryOrganizationId: string;
  role: UserRecord['role'];
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  temporaryPassword?: string;
  language?: 'ja' | 'en';
  timezone?: string;
}

export class UserRepository extends BaseRepository {
  private cognitoService?: CognitoService;
  
  constructor() {
    super(tableNames.users); // Pass the table name to BaseRepository
    // Lazy initialization of Cognito service
  }

  private getCognitoService(): CognitoService {
    if (!this.cognitoService) {
      this.cognitoService = createCognitoService();
    }
    return this.cognitoService;
  }

  /**
   * Create user both in Cognito and DynamoDB
   */
  async createUserWithCognito(request: CreateUserWithCognitoRequest, createdBy: string): Promise<UserRecord> {
    try {
      // 1. Create user in Cognito
      const cognitoRequest: CreateUserRequest = {
        username: request.username,
        email: request.email,
        temporaryPassword: request.temporaryPassword,
        attributes: {
          email: request.email,
          given_name: request.firstName,
          family_name: request.lastName,
          'custom:organization_id': request.primaryOrganizationId,
          'custom:role': request.role
        },
        groups: [request.role] // Add user to role group
      };

      const cognitoUsername = await this.getCognitoService().createUser(cognitoRequest);
      
      // 2. Get Cognito user details to extract sub
      const cognitoUser = await this.getCognitoService().getUser(cognitoUsername);
      const cognitoSub = cognitoUser.attributes?.sub;

      if (!cognitoSub) {
        throw new Error('Failed to get Cognito user sub');
      }

      // 3. Create user record in DynamoDB
      const userRecord: UserRecord = {
        userId: `user-${request.username}-${Date.now()}`,
        username: request.username,
        email: request.email,
        cognitoSub,
        firstName: request.firstName,
        lastName: request.lastName,
        displayName: `${request.firstName} ${request.lastName}`,
        title: request.title,
        department: request.department,
        specialization: request.specialization,
        licenseNumber: request.licenseNumber,
        primaryOrganizationId: request.primaryOrganizationId,
        accessibleOrganizations: [request.primaryOrganizationId],
        role: request.role,
        permissions: this.getDefaultPermissions(request.role),
        cognitoGroups: [request.role],
        accessibleStudies: [],
        status: 'pending_activation',
        language: request.language || 'ja',
        timezone: request.timezone || 'Asia/Tokyo',
        createdBy,
        lastModifiedBy: createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityType: 'user'
      };

      await this.save(userRecord);
      return userRecord;

    } catch (error) {
      console.error('Error creating user with Cognito:', error);
      throw error;
    }
  }

  /**
   * Update user in both Cognito and DynamoDB
   */
  async updateUserWithCognito(userId: string, updates: Partial<UserRecord>, updatedBy: string): Promise<UserRecord> {
    try {
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // 1. Update Cognito if relevant fields are being updated
      if (updates.email || updates.firstName || updates.lastName || updates.primaryOrganizationId || updates.role || updates.cognitoGroups) {
        const cognitoUpdate: UpdateUserRequest = {
          username: existingUser.username,
          attributes: {},
          groups: updates.cognitoGroups || existingUser.cognitoGroups
        };

        if (updates.email) cognitoUpdate.attributes!.email = updates.email;
        if (updates.firstName) cognitoUpdate.attributes!.given_name = updates.firstName;
        if (updates.lastName) cognitoUpdate.attributes!.family_name = updates.lastName;
        if (updates.primaryOrganizationId) cognitoUpdate.attributes!['custom:organization_id'] = updates.primaryOrganizationId;
        if (updates.role) cognitoUpdate.attributes!['custom:role'] = updates.role;

        await this.getCognitoService().updateUser(cognitoUpdate);
      }

      // 2. Update DynamoDB record
      const updatedUser: UserRecord = {
        ...existingUser,
        ...updates,
        lastModifiedBy: updatedBy,
        updatedAt: new Date().toISOString()
      };

      await this.save(updatedUser);
      return updatedUser;

    } catch (error) {
      console.error('Error updating user with Cognito:', error);
      throw error;
    }
  }

  /**
   * Delete user from both Cognito and DynamoDB
   */
  async deleteUserWithCognito(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 1. Delete from Cognito
      await this.getCognitoService().deleteUser(user.username);

      // 2. Delete from DynamoDB
      await this.delete(userId);

    } catch (error) {
      console.error('Error deleting user with Cognito:', error);
      throw error;
    }
  }

  /**
   * Find user by Cognito sub (for JWT token validation)
   */
  async findByCognitoSub(cognitoSub: string): Promise<UserRecord | null> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'CognitoSubIndex',
        KeyConditionExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':sub': cognitoSub
        }
      }));

      return result.Items?.[0] as UserRecord || null;
    } catch (error) {
      console.error('Error finding user by Cognito sub:', error);
      return null;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserRecord | null> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username
        }
      }));

      return result.Items?.[0] as UserRecord || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  /**
   * List users by organization
   */
  async findByOrganization(organizationId: string): Promise<UserRecord[]> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'OrganizationIndex', // You'll need to create this GSI
        KeyConditionExpression: 'primaryOrganizationId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': organizationId
        }
      }));

      return result.Items as UserRecord[] || [];
    } catch (error) {
      console.error('Error finding users by organization:', error);
      return [];
    }
  }

  /**
   * Sync user data from Cognito (useful for keeping data in sync)
   */
  async syncFromCognito(username: string): Promise<UserRecord | null> {
    try {
      const cognitoUser = await this.getCognitoService().getUser(username);
      const localUser = await this.findByUsername(username);

      if (!localUser) {
        console.warn(`Local user not found for username: ${username}`);
        return null;
      }

      // Update local user with Cognito data
      const updates: Partial<UserRecord> = {
        email: cognitoUser.attributes?.email || localUser.email,
        firstName: cognitoUser.attributes?.given_name || localUser.firstName,
        lastName: cognitoUser.attributes?.family_name || localUser.lastName,
        primaryOrganizationId: cognitoUser.attributes?.['custom:organization_id'] || localUser.primaryOrganizationId,
        role: cognitoUser.attributes?.['custom:role'] || localUser.role,
        cognitoGroups: cognitoUser.groups || [],
        status: this.mapCognitoStatusToLocal(cognitoUser.userStatus)
      };

      return await this.updateUserWithCognito(localUser.userId, updates, 'system-sync');

    } catch (error) {
      console.error('Error syncing user from Cognito:', error);
      return null;
    }
  }

  /**
   * Get default permissions based on role
   */
  private getDefaultPermissions(role: UserRecord['role']): string[] {
    const permissionMap: Record<UserRecord['role'], string[]> = {
      'super_admin': ['*'],
      'study_admin': ['study:*', 'organization:*', 'user:*'],
      'org_admin': ['organization:manage', 'user:manage', 'patient:manage'],
      'investigator': ['study:view', 'patient:manage', 'visit:manage', 'examination:manage'],
      'coordinator': ['patient:manage', 'visit:manage', 'examination:manage'],
      'data_entry': ['examination:create', 'examination:update', 'visit:view'],
      'viewer': ['study:view', 'patient:view', 'visit:view', 'examination:view']
    };

    return permissionMap[role] || [];
  }

  /**
   * Map Cognito user status to local status
   */
  private mapCognitoStatusToLocal(cognitoStatus: string): UserRecord['status'] {
    const statusMap: Record<string, UserRecord['status']> = {
      'CONFIRMED': 'active',
      'UNCONFIRMED': 'pending_activation',
      'ARCHIVED': 'inactive',
      'COMPROMISED': 'suspended',
      'UNKNOWN': 'inactive',
      'RESET_REQUIRED': 'pending_activation',
      'FORCE_CHANGE_PASSWORD': 'pending_activation'
    };

    return statusMap[cognitoStatus] || 'inactive';
  }

  protected getPrimaryKeyName(): string {
    return 'userId';
  }

  protected getSortKeyName(): string | null {
    return null;
  }

  protected getIndexPartitionKeyName(indexName: string): string | null {
    switch (indexName) {
      case indexNames.usernameIndex:
        return 'username';
      case indexNames.cognitoSubIndex:
        return 'cognitoSub';
      case indexNames.organizationIndex:
        return 'primaryOrganizationId';
      default:
        return null;
    }
  }

  protected getIndexSortKeyName(indexName: string): string | null {
    // The Users table doesn't have sort keys on any indexes
    return null;
  }
}