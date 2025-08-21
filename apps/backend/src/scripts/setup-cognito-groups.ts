import { createCognitoService } from '../config/cognito.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface RoleConfig {
  name: string;
  description: string;
  precedence: number;
}

const roles: RoleConfig[] = [
  {
    name: 'super_admin',
    description: 'Super Administrator with full system access',
    precedence: 10
  },
  {
    name: 'study_admin',
    description: 'Study Administrator with access to all clinical studies',
    precedence: 20
  },
  {
    name: 'org_admin',
    description: 'Organization Administrator with access to organization management',
    precedence: 30
  },
  {
    name: 'investigator',
    description: 'Principal Investigator with study and patient management access',
    precedence: 40
  },
  {
    name: 'coordinator',
    description: 'Study Coordinator with patient and visit management access',
    precedence: 50
  },
  {
    name: 'data_entry',
    description: 'Data Entry staff with examination data input access',
    precedence: 60
  },
  {
    name: 'viewer',
    description: 'Read-only access to assigned studies and data',
    precedence: 70
  }
];

async function setupCognitoGroups() {
  console.log('Setting up Cognito Groups for RBAC...');
  
  try {
    const cognitoService = createCognitoService();
    
    // First, list existing groups
    console.log('Checking existing groups...');
    const existingGroups = await cognitoService.listGroups();
    const existingGroupNames = existingGroups.map(group => group.groupName);
    
    console.log(`Found ${existingGroups.length} existing groups:`, existingGroupNames);
    
    // Create missing groups
    for (const role of roles) {
      if (existingGroupNames.includes(role.name)) {
        console.log(`✓ Group '${role.name}' already exists`);
      } else {
        try {
          await cognitoService.createGroup(role.name, role.description, role.precedence);
          console.log(`✓ Created group '${role.name}'`);
        } catch (error) {
          console.error(`✗ Failed to create group '${role.name}':`, error.message);
        }
      }
    }
    
    // List all groups after setup
    console.log('\nFinal group configuration:');
    const finalGroups = await cognitoService.listGroups();
    finalGroups.forEach(group => {
      console.log(`  - ${group.groupName}: ${group.description} (precedence: ${group.precedence})`);
    });
    
    console.log('\n✅ Cognito Groups setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up Cognito Groups:', error);
    process.exit(1);
  }
}

// Custom attributes configuration guide
function printCustomAttributesGuide() {
  console.log('\n📋 Required Custom Attributes Configuration:');
  console.log('Please ensure the following custom attributes are configured in your Cognito User Pool:');
  console.log('');
  console.log('1. custom:organization_id');
  console.log('   - Type: String');
  console.log('   - Description: Primary organization ID for the user');
  console.log('   - Mutable: Yes');
  console.log('   - Required: No');
  console.log('   - Max Length: 256');
  console.log('');
  console.log('2. custom:role');
  console.log('   - Type: String');
  console.log('   - Description: User role (redundant with groups, for backward compatibility)');
  console.log('   - Mutable: Yes');
  console.log('   - Required: No');
  console.log('   - Max Length: 50');
  console.log('');
  console.log('3. custom:accessible_organizations (Optional)');
  console.log('   - Type: String');
  console.log('   - Description: Comma-separated list of accessible organization IDs');
  console.log('   - Mutable: Yes');
  console.log('   - Required: No');
  console.log('   - Max Length: 2048');
  console.log('');
  console.log('4. custom:accessible_studies (Optional)');
  console.log('   - Type: String');
  console.log('   - Description: Comma-separated list of accessible study IDs');
  console.log('   - Mutable: Yes');
  console.log('   - Required: No');
  console.log('   - Max Length: 2048');
  console.log('');
  console.log('You can configure these in the AWS Console:');
  console.log('AWS Cognito > User Pools > [Your Pool] > Sign-up experience > Custom attributes');
  console.log('');
  console.log('💡 RBAC Implementation Notes:');
  console.log('- Groups are the primary mechanism for role assignment');
  console.log('- Custom attributes provide additional context and backward compatibility');
  console.log('- Site-based access control uses organization associations');
  console.log('- Role hierarchy prevents privilege escalation');
  console.log('');
}

// Group policies configuration guide
function printGroupPoliciesGuide() {
  console.log('\n🔐 Cognito Group Policies Configuration:');
  console.log('For enhanced security, you can attach IAM policies to Cognito Groups:');
  console.log('');
  
  roles.forEach(role => {
    console.log(`${role.name}:`);
    console.log(`  - Description: ${role.description}`);
    console.log(`  - Precedence: ${role.precedence}`);
    
    // Suggest IAM policy actions based on role
    const policyActions = getRoleIAMActions(role.name);
    if (policyActions.length > 0) {
      console.log(`  - Suggested IAM Actions: ${policyActions.join(', ')}`);
    }
    console.log('');
  });
  
  console.log('Note: IAM policies are optional but recommended for additional security layers.');
  console.log('');
}

// Get suggested IAM actions for each role
function getRoleIAMActions(roleName: string): string[] {
  const actionMap: Record<string, string[]> = {
    'super_admin': [
      'dynamodb:*',
      'cognito-idp:*',
      'logs:*'
    ],
    'study_admin': [
      'dynamodb:Query',
      'dynamodb:Scan',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'cognito-idp:AdminGetUser',
      'cognito-idp:AdminUpdateUserAttributes'
    ],
    'org_admin': [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem'
    ],
    'investigator': [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem'
    ],
    'coordinator': [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem'
    ],
    'data_entry': [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem'
    ],
    'viewer': [
      'dynamodb:Query',
      'dynamodb:GetItem'
    ]
  };

  return actionMap[roleName] || [];
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCognitoGroups().then(() => {
    printCustomAttributesGuide();
    printGroupPoliciesGuide();
  });
}

export { setupCognitoGroups, roles };