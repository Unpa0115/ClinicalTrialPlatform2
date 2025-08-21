import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  CreateGroupCommand,
  ListGroupsCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUser, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js';

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  clientSecret?: string;
  region: string;
}

export interface UserAttributes {
  email: string;
  given_name?: string;
  family_name?: string;
  'custom:organization_id'?: string;
  'custom:role'?: string;
  [key: string]: string | undefined;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  temporaryPassword?: string;
  attributes?: UserAttributes;
  groups?: string[];
}

export interface UpdateUserRequest {
  username: string;
  attributes?: UserAttributes;
  groups?: string[];
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPool: CognitoUserPool;
  private config: CognitoConfig;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({ 
      region: config.region 
    });
    
    this.userPool = new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId
    });
  }

  /**
   * Create a new user in Cognito User Pool
   */
  async createUser(request: CreateUserRequest): Promise<string> {
    const attributeList = Object.entries(request.attributes || {})
      .map(([name, value]) => ({ Name: name, Value: value }));

    // Add email to attributes if not already present
    if (!attributeList.find(attr => attr.Name === 'email')) {
      attributeList.push({ Name: 'email', Value: request.email });
    }

    const command = new AdminCreateUserCommand({
      UserPoolId: this.config.userPoolId,
      Username: request.username,
      UserAttributes: attributeList,
      TemporaryPassword: request.temporaryPassword,
      MessageAction: 'SUPPRESS' // Don't send welcome email for now
    });

    const result = await this.client.send(command);
    
    // Add user to groups if specified
    if (request.groups && request.groups.length > 0) {
      await this.addUserToGroups(request.username, request.groups);
    }

    return result.User?.Username || request.username;
  }

  /**
   * Get user details from Cognito
   */
  async getUser(username: string): Promise<any> {
    const command = new AdminGetUserCommand({
      UserPoolId: this.config.userPoolId,
      Username: username
    });

    const result = await this.client.send(command);
    return {
      username: result.Username,
      userStatus: result.UserStatus,
      enabled: result.Enabled,
      attributes: result.UserAttributes?.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>),
      groups: await this.getUserGroups(username)
    };
  }

  /**
   * List all users with pagination
   */
  async listUsers(limit: number = 10, paginationToken?: string): Promise<any> {
    const command = new ListUsersCommand({
      UserPoolId: this.config.userPoolId,
      Limit: limit,
      PaginationToken: paginationToken
    });

    const result = await this.client.send(command);
    return {
      users: result.Users?.map(user => ({
        username: user.Username,
        userStatus: user.UserStatus,
        enabled: user.Enabled,
        attributes: user.Attributes?.reduce((acc, attr) => {
          if (attr.Name && attr.Value) {
            acc[attr.Name] = attr.Value;
          }
          return acc;
        }, {} as Record<string, string>)
      })),
      paginationToken: result.PaginationToken
    };
  }

  /**
   * Update user attributes
   */
  async updateUser(request: UpdateUserRequest): Promise<void> {
    if (request.attributes) {
      const attributeList = Object.entries(request.attributes)
        .map(([name, value]) => ({ Name: name, Value: value }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.config.userPoolId,
        Username: request.username,
        UserAttributes: attributeList
      });

      await this.client.send(command);
    }

    if (request.groups) {
      // First remove user from all current groups, then add to new groups
      const currentGroups = await this.getUserGroups(request.username);
      if (currentGroups.length > 0) {
        await this.removeUserFromGroups(request.username, currentGroups);
      }
      if (request.groups.length > 0) {
        await this.addUserToGroups(request.username, request.groups);
      }
    }
  }

  /**
   * Delete user from Cognito
   */
  async deleteUser(username: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.config.userPoolId,
      Username: username
    });

    await this.client.send(command);
  }

  /**
   * Set user password (admin action)
   */
  async setUserPassword(username: string, password: string, permanent: boolean = true): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.config.userPoolId,
      Username: username,
      Password: password,
      Permanent: permanent
    });

    await this.client.send(command);
  }

  /**
   * Add user to groups
   */
  async addUserToGroups(username: string, groups: string[]): Promise<void> {
    const promises = groups.map(groupName =>
      this.client.send(new AdminAddUserToGroupCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        GroupName: groupName
      }))
    );

    await Promise.all(promises);
  }

  /**
   * Remove user from groups
   */
  async removeUserFromGroups(username: string, groups: string[]): Promise<void> {
    const promises = groups.map(groupName =>
      this.client.send(new AdminRemoveUserFromGroupCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        GroupName: groupName
      }))
    );

    await Promise.all(promises);
  }

  /**
   * Get user's groups
   */
  async getUserGroups(username: string): Promise<string[]> {
    try {
      const user = await this.getUser(username);
      // This is a simplified approach - in practice you might need to use AdminListGroupsForUser
      return []; // TODO: Implement proper group fetching
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  /**
   * Create a group in Cognito User Pool
   */
  async createGroup(groupName: string, description?: string, precedence?: number): Promise<void> {
    const command = new CreateGroupCommand({
      UserPoolId: this.config.userPoolId,
      GroupName: groupName,
      Description: description,
      Precedence: precedence
    });

    await this.client.send(command);
  }

  /**
   * List all groups in the User Pool
   */
  async listGroups(): Promise<any[]> {
    const command = new ListGroupsCommand({
      UserPoolId: this.config.userPoolId
    });

    const result = await this.client.send(command);
    return result.Groups?.map(group => ({
      groupName: group.GroupName,
      description: group.Description,
      precedence: group.Precedence,
      creationDate: group.CreationDate,
      lastModifiedDate: group.LastModifiedDate
    })) || [];
  }
}

// Factory function to create Cognito service instance
export function createCognitoService(): CognitoService {
  const config: CognitoConfig = {
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    clientId: process.env.COGNITO_BACKEND_CLIENT_ID!,
    clientSecret: process.env.COGNITO_BACKEND_CLIENT_SECRET,
    region: process.env.AWS_REGION || 'ap-northeast-1'
  };

  return new CognitoService(config);
}