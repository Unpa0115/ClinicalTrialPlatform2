# Requirements Document: 眼科臨床試験管理プラットフォーム

## Introduction

眼科臨床試験管理プラットフォームは、眼科臨床試験における包括的なデータ収集、管理、および監査を支援するWebベースのシステムです。システムは臨床試験プロトコルの管理から、マルチサイトでの患者データ収集、監査ログ管理まで、臨床試験の全ライフサイクルをサポートします。階層的なデータ構造（ClinicalStudy → Survey → Visit → 検査データ）により、標準化された試験実施と高品質なデータ収集を実現します。

## Requirements

### Requirement 1

**User Story:** As a 研究責任者, I want to create and manage clinical study protocols with standardized visit templates, so that I can ensure consistent trial implementation across multiple sites.

#### Acceptance Criteria

1. WHEN a 研究責任者 creates a new clinical study THEN the system SHALL provide fields for study metadata (study name, protocol version, regulatory approvals, target sites, patient capacity)
2. WHEN a 研究責任者 defines visit templates THEN the system SHALL allow configuring visit schedules with window periods, required examinations, and protocol compliance rules
3. WHEN a 研究責任者 activates a study THEN the system SHALL automatically generate survey templates for participating sites
4. WHEN a 研究責任者 views study progress THEN the system SHALL display enrollment status, completion rates, and protocol deviations across all sites

### Requirement 2

**User Story:** As a 組織管理者, I want to manage organization information and user access controls, so that I can ensure proper authorization and data security across multiple research organizations.

#### Acceptance Criteria

1. WHEN a 組織管理者 registers a new organization THEN the system SHALL provide fields for organization information (name, address, contact details, capabilities, certifications)
2. WHEN a 組織管理者 manages users THEN the system SHALL support role-based access control with roles (super_admin, study_admin, org_admin, investigator, coordinator, data_entry, viewer)
3. WHEN a 組織管理者 assigns study access THEN the system SHALL allow granular permissions for specific clinical studies and examination types
4. WHEN a 組織管理者 monitors organization activity THEN the system SHALL provide audit logs showing all user actions with timestamps and IP addresses

### Requirement 3

**User Story:** As a 組織管理者, I want to manage patient master data and assign existing patients to surveys, so that I can efficiently utilize existing patient information across multiple clinical studies.

#### Acceptance Criteria

1. WHEN a 組織管理者 registers a new patient THEN the system SHALL provide fields for anonymized patient information (patient code, initials, demographics, medical history)
2. WHEN a 組織管理者 searches for existing patients THEN the system SHALL provide search functionality by patient code, initials, and registration date within the organization
3. WHEN a 組織管理者 assigns an existing patient to a survey THEN the system SHALL allow selection from the patient master and automatic survey generation based on clinical study templates
4. WHEN a 組織管理者 views patient participation THEN the system SHALL display all active and completed surveys for each patient with status and progress information

### Requirement 4

**User Story:** As a 検査者, I want to input comprehensive ophthalmologic examination data through flexible structured forms, so that I can capture required clinical measurements efficiently with visit-specific examination configurations.

#### Acceptance Criteria

1. WHEN a 検査者 starts data entry for a visit THEN the system SHALL present a dynamic multi-step form based on the visit's examination configuration (可変ステップ数)
2. WHEN entering 基礎情報 data THEN the system SHALL provide fields for both eyes including: 現在使用CL, 角膜曲率半径(R1/R2/Ave), 屈折検査(VA/S/C/Ax), 眼圧, 角膜内皮細胞
3. WHEN entering VAS data THEN the system SHALL provide visual analog scale inputs (0-100) for comfort level, dryness level, and visual performance assessments
4. WHEN entering 相対評価 data THEN the system SHALL provide comparative assessment fields with reason text for comfort, dryness, visual performance, eye strain, and total satisfaction
5. WHEN entering フィッティング・涙濡れ性検査 data THEN the system SHALL provide detailed fitting assessment fields including lens movement, position, wettability, and FACE2 coordinates
6. WHEN entering 涙液層検査 data THEN the system SHALL provide tear film assessment fields including break-up time, Schirmer test, and meniscus measurements
7. WHEN entering 矯正視力検査 data THEN the system SHALL provide corrected visual acuity fields with lens correction parameters and clarity/stability assessments
8. WHEN entering レンズ検査 data THEN the system SHALL provide lens inspection fields for deposits, scratches, and damage assessment
9. WHEN entering 問診 data THEN the system SHALL provide comprehensive questionnaire fields with time-based symptom assessment and detailed reason text

### Requirement 5

**User Story:** As a 検査者, I want to save draft data and resume data entry later, so that I can handle interruptions during examination sessions without losing data across flexible examination configurations.

#### Acceptance Criteria

1. WHEN a 検査者 is entering data THEN the system SHALL automatically save draft data every 30 seconds with integrated management across all configured examination groups
2. WHEN a 検査者 manually saves a draft THEN the system SHALL store the current form state including current step, total steps, completed examinations, and examination order with confirmation message
3. WHEN a 検査者 returns to an incomplete visit THEN the system SHALL restore all previously entered data and highlight incomplete sections based on the visit's examination configuration
4. WHEN a 検査者 completes all required fields THEN the system SHALL allow final submission and automatically save data to individual examination tables while clearing draft data
4. WHEN viewing VAS scores THEN the system SHALL display visual analog scale results with both numerical values and graphical representation

### Requirement 5

**User Story:** As an administrator, I want to manage data integrity and make corrections when necessary, so that I can ensure accurate clinical data collection.

#### Acceptance Criteria

1. WHEN an administrator accesses the system THEN the system SHALL provide elevated permissions for data modification
2. WHEN an administrator edits completed visit data THEN the system SHALL log all changes with timestamp and administrator ID
3. WHEN data is modified THEN the system SHALL maintain an audit trail showing original values, new values, and modification details
4. WHEN an administrator deletes a visit THEN the system SHALL require confirmation and log the deletion with reason

### Requirement 6

**User Story:** As a 検査者, I want to input specialized examination data for contact lens fitting and tear film assessment, so that I can capture comprehensive ophthalmologic measurements.

#### Acceptance Criteria

1. WHEN entering フィッティング検査 data THEN the system SHALL provide fields for lens specifications, movement assessment (0-5 scale), and fitting quality ratings
2. WHEN entering 涙濡れ性検査 data THEN the system SHALL provide fields for tear break-up time, Schirmer test results, and tear meniscus measurements
3. WHEN entering FACE2 assessment THEN the system SHALL provide structured questionnaire fields with appropriate response scales
4. WHEN entering VAS scores THEN the system SHALL provide visual analog scale input controls (0-100mm) for comfort and symptom assessment

### Requirement 6

**User Story:** As a 検査者, I want to manage patient surveys and visits within clinical study protocols, so that I can ensure protocol compliance and track patient progress systematically with flexible visit configurations.

#### Acceptance Criteria

1. WHEN a 検査者 creates a patient survey THEN the system SHALL automatically generate visit schedules based on the clinical study template with proper window periods and visit-specific examination configurations
2. WHEN a 検査者 schedules a visit THEN the system SHALL validate the visit date against protocol window periods and alert for deviations
3. WHEN a 検査者 tracks visit progress THEN the system SHALL display completion percentage, required examinations based on visit configuration, and protocol compliance status
4. WHEN a 検査者 completes a visit THEN the system SHALL update visit status and trigger any required follow-up actions according to the protocol

### Requirement 7

**User Story:** As a 検査者, I want to view and navigate through examination data efficiently, so that I can review previous visits and track patient progress across multiple time points with flexible examination configurations.

#### Acceptance Criteria

1. WHEN a 検査者 views a completed visit THEN the system SHALL display all examination data in a read-only format organized by the visit's specific examination configuration
2. WHEN a 検査者 navigates between visits THEN the system SHALL provide clear navigation controls showing visit dates, types, examination configurations, and completion status
3. WHEN a 検査者 compares visits THEN the system SHALL highlight changes in key measurements between visits with visual indicators, accounting for different examination configurations
4. WHEN viewing VAS scores THEN the system SHALL display visual analog scale results with both numerical values and graphical representation

### Requirement 8

**User Story:** As a データ管理者, I want to ensure data integrity and make corrections when necessary, so that I can maintain accurate clinical data collection with full audit trails.

#### Acceptance Criteria

1. WHEN a データ管理者 accesses the system THEN the system SHALL provide elevated permissions for data modification across all examination types
2. WHEN a データ管理者 edits completed visit data THEN the system SHALL log all changes with timestamp, user ID, original values, and new values in the audit log
3. WHEN data is modified THEN the system SHALL maintain an audit trail showing complete change history with reasons for modifications
4. WHEN a データ管理者 deletes a visit THEN the system SHALL require confirmation and log the deletion with detailed reason in the audit system

### Requirement 9

**User Story:** As a 品質管理者, I want to monitor system usage and data quality across all organizations, so that I can ensure compliance with regulatory requirements and identify potential issues.

#### Acceptance Criteria

1. WHEN a 品質管理者 reviews audit logs THEN the system SHALL provide comprehensive logging of all user actions including login/logout, data entry, modifications, and exports
2. WHEN a 品質管理者 monitors data quality THEN the system SHALL provide dashboards showing completion rates, protocol deviations, and data validation errors by organization
3. WHEN a 品質管理者 generates compliance reports THEN the system SHALL export audit trails and data quality metrics in regulatory-compliant formats
4. WHEN a 品質管理者 investigates incidents THEN the system SHALL provide detailed event logs with user context, IP addresses, and session information

### Requirement 10

**User Story:** As a 問診担当者, I want to conduct comprehensive questionnaires with detailed symptom assessment, so that I can capture patient-reported outcomes systematically.

#### Acceptance Criteria

1. WHEN conducting a questionnaire THEN the system SHALL provide structured forms for comfort assessment across different time periods (initial, daytime, afternoon, end-of-day)
2. WHEN assessing dryness symptoms THEN the system SHALL provide time-based dryness evaluation fields with detailed reason text for each assessment
3. WHEN evaluating lens handling THEN the system SHALL provide fields for ease of insertion/removal with detailed explanations
4. WHEN recording other symptoms THEN the system SHALL provide comprehensive symptom tracking including irritation, burning, visual performance, and eye strain with detailed descriptions

### Requirement 11

**User Story:** As a システム管理者, I want to manage the overall system configuration and security, so that I can ensure proper operation and compliance with data protection regulations.

#### Acceptance Criteria

1. WHEN a システム管理者 configures the system THEN the system SHALL provide settings for data retention policies, backup schedules, and security parameters
2. WHEN a システム管理者 monitors system health THEN the system SHALL provide dashboards showing system performance, database status, and error rates
3. WHEN a システム管理者 manages security THEN the system SHALL support multi-factor authentication, session management, and IP-based access controls
4. WHEN a システム管理者 handles incidents THEN the system SHALL provide incident response tools including user session termination and emergency data protection measures