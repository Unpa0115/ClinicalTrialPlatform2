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
  AdminListGroupsForUserCommand,
  CreateGroupCommand,
  ListGroupsCommand,
  AdminInitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
// Note: amazon-cognito-identity-js is not used in backend, only AWS SDK

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

export interface AuthenticateUserRequest {
  username: string;
  password: string;
}

export interface AuthenticationResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  accessTokenPayload: any;
  idTokenPayload: any;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({ 
      region: config.region 
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
    const groups = await this.getUserGroups(username);
    
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
      groups
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
      const command = new AdminListGroupsForUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username
      });

      const result = await this.client.send(command);
      return result.Groups?.map(group => group.GroupName || '') || [];
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

  /**
   * Authenticate user with username and password
   */
  async authenticateUser(request: AuthenticateUserRequest): Promise<AuthenticationResult> {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.config.userPoolId,
      ClientId: this.config.clientId,
      AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
      AuthParameters: {
        USERNAME: request.username,
        PASSWORD: request.password
      }
    });

    const result = await this.client.send(command);
    
    if (!result.AuthenticationResult) {
      throw new Error('Authentication failed: No authentication result');
    }

    const { AccessToken, RefreshToken, IdToken } = result.AuthenticationResult;
    
    if (!AccessToken || !RefreshToken || !IdToken) {
      throw new Error('Authentication failed: Missing tokens');
    }

    // Decode JWT tokens to get payload information
    const accessTokenPayload = this.decodeJWTPayload(AccessToken);
    const idTokenPayload = this.decodeJWTPayload(IdToken);

    return {
      accessToken: AccessToken,
      refreshToken: RefreshToken,
      idToken: IdToken,
      accessTokenPayload,
      idTokenPayload
    };
  }

  /**
   * Decode JWT token payload
   */
  private decodeJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Add padding if needed for base64 decoding
      let payload = parts[1];
      while (payload.length % 4) {
        payload += '=';
      }

      // Replace URL-safe characters
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');

      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('JWT decode error:', error);
      throw new Error('Failed to decode JWT token');
    }
  }
}

// Factory function to create Cognito service instance
export function createCognitoService(): CognitoService {
  // Temporarily hardcode the correct values to bypass environment issues
  const userPoolId = 'ap-northeast-1_lZY0h55Lb';
  const clientId = '6843md3ha7djpnb3gc344nnlae';
  
  // DEBUG: Log the actual values being used
  console.log('Cognito Service Configuration (HARDCODED FOR TESTING):');
  console.log('COGNITO_USER_POOL_ID:', userPoolId);
  console.log('COGNITO_BACKEND_CLIENT_ID:', clientId);
  
  if (!userPoolId || !clientId) {
    console.error('Missing Cognito configuration:');
    console.error('COGNITO_USER_POOL_ID:', userPoolId ? 'SET' : 'MISSING');
    console.error('COGNITO_BACKEND_CLIENT_ID:', clientId ? 'SET' : 'MISSING');
    throw new Error('Missing required Cognito environment variables. Please check your .env.local file.');
  }

  const config: CognitoConfig = {
    userPoolId,
    clientId,
    clientSecret: process.env.COGNITO_BACKEND_CLIENT_SECRET,
    region: 'ap-northeast-1'
  };

  return new CognitoService(config);
}