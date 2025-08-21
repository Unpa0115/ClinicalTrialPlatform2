# Implementation Plan

- [x] 1. Set up project structure and create key UI mockups
  - Create monorepo structure with frontend (React), backend (Express.js), and shared TypeScript libraries
  - Configure TypeScript, ESLint, and Prettier for consistent code quality
  - Set up Docker containers for development environment with DynamoDB Local
  - Configure AWS SDK v3 for DynamoDB integration
  - **Create UI mockups for critical workflows: clinical study creation, patient survey management, dynamic examination data entry, and data review**
  - **Implement dynamic visit template configuration with add/remove functionality (default 2 visits)**
  - **Implement examination item selection interface with 8 available examination types**
  - **Create left/right eye parallel data entry interface with automatic field population (Eyeside, SurveyId, VisitId)**
  - Set up CI/CD pipeline with automated testing and deployment
  - _Requirements: 1.1, 4.1, 10.1, 10.2, All UI-related requirements_

- [x] 2. Validate mockups and implement DynamoDB database schema
  - [x] 2.1 Validate mockups with stakeholders and refine data requirements
    - Review UI mockups with clinical staff and data managers
    - Confirm dynamic examination configuration requirements
    - Validate patient master management workflow
    - Refine data structures based on UI feedback
    - _Requirements: All requirements validation_

  - [x] 2.2 Create DynamoDB table definitions and setup
    - Design and create 16 DynamoDB tables (ClinicalStudy, Organizations, Users, Patients, Surveys, Visits, 8 examination tables, AuditLog, DraftData)
    - Configure table schemas with proper partition keys, sort keys, and GSI indexes based on validated UI requirements
    - **Update examination table schemas to include standardized Eyeside field ('Right'/'Left') and automatic SurveyId/VisitId population**
    - Set up TTL configuration for DraftData table (30 days)
    - Create table creation scripts and CloudFormation templates
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [x] 2.3 Implement repository pattern for all data models
    - Create base DynamoDBRepository class with common CRUD operations
    - Implement specific repositories for each table (ClinicalStudyRepository, OrganizationRepository, UserRepository, PatientRepository, etc.)
    - Add query optimization for visit-based data access patterns and organization-based patient search
    - **Implement batch operations for left/right eye data management with automatic Eyeside field population**
    - **Create specialized methods for dynamic visit configuration and examination item management**
    - Write comprehensive unit tests for all repository methods
    - _Requirements: 1.1, 3.1, 4.1_

  - [x] 2.4 Create data validation and TypeScript interfaces
    - Define TypeScript interfaces for all 16 table records including flexible visit configuration support
    - **Update examination data interfaces to include BaseExaminationData with Eyeside, SurveyId, VisitId fields**
    - **Create specialized interfaces for BasicInfoExaminationData, VASExaminationData, ComparativeExaminationData, FittingExaminationData**
    - Implement data validation functions using Zod or similar library
    - Create data transformation utilities for API responses
    - Add error handling for DynamoDB operations
    - Write integration tests with DynamoDB Local
    - _Requirements: 4.1, 8.1_

- [x] 3. Implement authentication and authorization system
  - [x] 3.1 Create user management and authentication service with AWS Cognito (existing User Pool configured)
    - Implement Users table operations for user profile data storage (extend Cognito user data)
    - Verify and configure Cognito Identity Pool for DynamoDB access control (if needed)
    - Implement Cognito SDK integration for user registration, login, and password reset flows
    - Configure and verify multi-factor authentication (MFA) settings in existing Cognito User Pool
    - Create middleware for Cognito JWT token validation using existing client configurations
    - Implement session management with Cognito tokens (access/refresh token handling)
    - Write unit tests for Cognito authentication flows with existing configuration
    - _Requirements: 2.1, 10.3_

  - [x] 3.2 Implement role-based access control (RBAC) with Cognito Groups
    - Define user roles (super_admin, study_admin, site_admin, investigator, coordinator, data_entry, viewer)
    - Create Cognito Groups in existing User Pool for role management and assignment
    - Configure custom attributes for organization/site associations in existing User Pool
    - Create permission system with granular access controls for clinical studies and sites
    - Implement middleware for route-level authorization using Cognito JWT claims and group membership
    - Add site-based access restrictions through Cognito custom attributes and group policies
    - Write tests for permission validation across all roles and Cognito Groups
    - _Requirements: 2.2, 2.3_

  - [x] 3.3 Create user management interface with existing Cognito configuration
    - Build user registration and profile management forms using existing Cognito clients (Backend + SPA)
    - Implement Cognito-based password reset functionality using existing domain configuration
    - Create admin interface for user management with Cognito Groups and role assignment
    - Add form validation and error handling for Cognito operations using AWS SDK
    - Implement user activity monitoring dashboard with existing CloudWatch integration
    - Configure Cognito triggers for user lifecycle events (pre-signup, post-authentication, etc.) if needed
    - _Requirements: 2.1, 2.4_

- [x] 4. Develop clinical study and organization management system
  - [x] 4.1 Create clinical study protocol management with flexible visit configuration
    - Implement ClinicalStudy table operations with flexible visit templates and examination configuration
    - Create study creation API with protocol versioning and regulatory approval tracking
    - Build study status management (planning, active, recruiting, completed, suspended, terminated)
    - Implement template-based survey generation from clinical study protocols with dynamic visit configuration
    - Write unit tests for study management logic including flexible examination ordering
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Build organization management system
    - Implement Organizations table operations with organization information and capabilities tracking
    - Create organization registration and management API endpoints
    - Add organization-study association management with patient capacity controls
    - Implement organization status management and approval workflow
    - Write API tests for organization management flows
    - _Requirements: 2.1, 2.2_

  - [x] 4.3 Create patient master management system
    - Implement Patients table operations with anonymized patient information
    - Create patient registration and search API endpoints with organization-based filtering
    - Build patient-survey assignment functionality for existing patients
    - Add patient participation tracking across multiple studies
    - Write unit tests for patient master management and assignment logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.4 Create clinical study and organization management interface with full CRUD functionality
    - [x] 4.4.1 Implement clinical study CRUD operations
      - Build clinical study creation form with flexible visit template configuration and examination selection
      - Create clinical study editing form with protocol versioning and status management
      - Implement clinical study detail view with complete protocol information and participant tracking
      - Add clinical study deletion functionality with confirmation and dependency checking
      - Build study listing and search interface with status filtering and pagination
      - Write component tests for clinical study CRUD workflows
      - _Requirements: 1.1, 1.2, 1.3, 1.4_
    
    - [x] 4.4.2 Implement organization CRUD operations
      - Create organization registration form with contact information and capabilities
      - Build organization editing form with status management and capacity updates
      - Implement organization detail view with associated studies and patient statistics
      - Add organization deletion functionality with confirmation and dependency checking
      - Create organization listing and search interface with status filtering
      - Write component tests for organization CRUD workflows
      - _Requirements: 2.1, 2.2_
    
    - [x] 4.4.3 Implement patient master CRUD operations
      - Build patient registration form with medical history and contact information
      - Create patient editing form with status management and medical information updates
      - Implement patient detail view with participation history and survey assignments
      - Add patient status management (active/inactive/withdrawn/completed) with confirmation
      - Build patient search and assignment interface with organization-based filtering
      - Create patient-survey assignment functionality for existing patients
      - Write component tests for patient master CRUD workflows
      - _Requirements: 3.1, 3.2, 3.3, 3.4_
    
    - [x] 4.4.4 Implement management interface integration
      - Add study-organization association interface with capacity management
      - Create bulk operations for patient assignments and status updates
      - Implement data validation and error handling across all CRUD operations
      - Add confirmation dialogs and success/error notifications for all operations
      - Build responsive design for mobile and tablet access
      - Write integration tests for cross-entity relationships and dependencies
      - _Requirements: 1.4, 2.1, 3.1_

- [ ] 5. Implement survey and visit management system with flexible configuration
  - [ ] 5.1 Create survey management with clinical study and patient integration
    - Implement Surveys table operations with clinical study and organization associations
    - Create patient survey generation from clinical study templates with patient master integration
    - Build survey status tracking and progress monitoring
    - Add baseline date management and visit scheduling automation
    - Write unit tests for survey lifecycle management including patient assignment
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 5.2 Build flexible visit management with dynamic examination configuration
    - Implement Visits table operations with flexible examination configuration and window period validation
    - Create visit scheduling API with protocol compliance checking and dynamic examination setup
    - Add visit status management (scheduled, in_progress, completed, missed, cancelled, rescheduled)
    - Implement dynamic examination tracking and completion percentage calculation based on visit configuration
    - Write API tests for flexible visit management and protocol validation
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 5.3 Create survey and visit management interface with dynamic configuration support
    - Build survey creation and management forms with clinical study integration and patient selection
    - Implement visit scheduling interface with calendar view, protocol windows, and examination configuration display
    - Create visit progress tracking dashboard with dynamic examination completion status
    - Add protocol deviation alerts and management interface
    - Write component tests for survey and visit management workflows with flexible configurations
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 6. Create comprehensive examination data collection system
  - [ ] 6.1 Implement basic examination data models (基礎情報, VAS, 相対評価, フィッティング・涙濡れ性検査)
    - Create BasicInfo table operations with corneal curvature, refraction, and intraocular pressure fields
    - Implement VAS table operations with visual analog scale inputs (0-100) for comfort and dryness
    - Build ComparativeScores table operations with comparative assessments and reason text fields
    - Create LensFluidSurfaceAssessment table operations with fitting assessment and FACE2 coordinates
    - Write unit tests for basic examination data validation and storage
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.2 Implement advanced examination data models (涙液層検査, 矯正視力検査, レンズ検査, 問診)
    - Create DR1 table operations for tear film assessment with break-up time and Schirmer test
    - Implement CorrectedVA table operations with lens correction parameters and clarity assessments
    - Build LensInspection table operations for lens deposit and damage assessment
    - Create Questionnaire table operations with comprehensive symptom tracking across time periods
    - Write unit tests for advanced examination data validation and storage
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 10.1, 10.2, 10.3, 10.4_

  - [ ] 6.3 Build flexible integrated draft data management system
    - Implement DraftData table operations with unified draft management across flexible examination configurations
    - Create auto-save functionality with 30-second intervals and manual save options supporting dynamic step counts
    - Build draft restoration system with flexible step-by-step progress tracking based on visit configuration
    - Add final submission logic that saves to individual tables and clears draft data
    - Write comprehensive tests for draft save/restore functionality with various examination configurations
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Build flexible multi-step examination data entry interface
  - [ ] 7.1 Create dynamic multi-step form framework with flexible progress tracking
    - Build React components for dynamic examination form with Material-UI supporting variable step counts
    - Implement form state management using React Context API and useReducer with flexible configuration support
    - Create progress indicator showing current step and completion status based on visit configuration
    - Add form validation using React Hook Form with Zod validation
    - Write component tests for form navigation and state management with various configurations
    - _Requirements: 4.1, 5.1_

  - [ ] 7.2 Implement basic examination data entry forms (基礎情報, VAS, 相対評価, フィッティング・涙濡れ性検査)
    - Build BasicInfo form with left/right eye data entry and validation
    - Create VAS form with visual analog scale input controls (0-100)
    - Implement ComparativeScores form with dropdown selections and reason text fields
    - Build LensFluidSurfaceAssessment form with fitting assessment and FACE2 coordinate inputs
    - Write component tests for each examination form with validation scenarios
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.3 Implement advanced examination data entry forms (涙液層検査, 矯正視力検査, レンズ検査, 問診)
    - Create DR1 form for tear film assessment with specialized input fields
    - Build CorrectedVA form with lens correction parameters and assessment dropdowns
    - Implement LensInspection form with lens condition assessment fields
    - Create Questionnaire form with comprehensive symptom tracking across time periods
    - Write component tests for advanced examination forms with complex validation
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 10.1, 10.2, 10.3, 10.4_

- [ ] 8. Implement data visualization and review system with flexible configuration support
  - [ ] 8.1 Create flexible examination data display components
    - Build read-only data display components for all examination groups with dynamic configuration support
    - Implement visit navigation controls with date, examination configuration, and completion status indicators
    - Create comparison views highlighting changes between visits accounting for different examination configurations
    - Add VAS score visualization with numerical and graphical representations
    - Write component tests for data display and navigation functionality with various configurations
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 8.2 Build data management and correction interface
    - Create data editing interface for authorized users with elevated permissions
    - Implement data modification forms with change tracking and reason fields
    - Build data deletion interface with confirmation and audit logging
    - Add bulk data operations for efficient data management
    - Write tests for data management workflows and permission controls
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 8.3 Create audit logging and compliance monitoring system
    - Implement AuditLog table operations with comprehensive event tracking
    - Build audit log viewing interface with filtering and search capabilities
    - Create compliance dashboard showing data quality metrics and protocol deviations by organization
    - Add audit trail export functionality for regulatory reporting
    - Write tests for audit logging accuracy and compliance reporting
    - _Requirements: 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Implement system administration and monitoring
  - [ ] 9.1 Create system configuration and health monitoring
    - Build system configuration interface for data retention policies and backup schedules
    - Implement system health dashboard showing database status and performance metrics
    - Create error monitoring and alerting system with notification capabilities
    - Add system maintenance tools for database optimization and cleanup
    - Write tests for system administration functionality
    - _Requirements: 10.1, 10.2_

  - [ ] 9.2 Build security management and incident response
    - Implement security dashboard with threat monitoring and user activity tracking
    - Create incident response tools including session termination and emergency controls
    - Build IP-based access controls and security policy management
    - Add security audit tools for compliance verification
    - Write security tests and vulnerability assessments
    - _Requirements: 10.3, 10.4_

- [ ] 10. Create comprehensive testing suite
  - [ ] 10.1 Implement unit tests for all services
    - Write unit tests for DynamoDB repositories and data validation
    - Create tests for authentication, authorization, and user management
    - Add tests for clinical study, survey, and visit management
    - Implement tests for all 8 examination data collection modules
    - Achieve 90% code coverage across all backend services
    - _Requirements: All requirements_

  - [ ] 10.2 Build integration and end-to-end tests
    - Create API integration tests for all endpoints with DynamoDB Local
    - Implement end-to-end user journey tests covering complete examination workflows
    - Build performance tests for multi-step form handling and draft management
    - Add security and compliance tests for audit logging and data protection
    - Write load tests for multi-site concurrent usage scenarios
    - _Requirements: All requirements_

- [ ] 11. Deploy and configure production environment
  - [ ] 11.1 Set up AWS production infrastructure
    - Configure DynamoDB tables in production with proper capacity settings and backup
    - Set up Docker containers deployment with AWS ECS or EKS
    - Implement CloudWatch monitoring and logging for all services
    - Configure Application Load Balancer with SSL certificates
    - Set up VPC with proper security groups and network access controls
    - _Requirements: 10.1, 10.2_

  - [ ] 11.2 Implement deployment pipeline and disaster recovery
    - Create automated CI/CD pipeline with AWS CodePipeline and CodeBuild
    - Set up blue-green deployment strategy with rollback capabilities
    - Implement DynamoDB point-in-time recovery and cross-region backup
    - Configure CloudWatch alarms and SNS notifications for system health
    - Create disaster recovery procedures and documentation
    - _Requirements: 10.2, 10.4_