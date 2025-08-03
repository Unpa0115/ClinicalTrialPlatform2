# Requirements Document - Phase 1: 眼科サーベイシステム

## Introduction

眼科サーベイシステムは、眼科臨床試験における検査データの収集と管理を効率化するWebベースのシステムです。システムは検査者が複数の眼科検査項目を統合されたフォームで入力し、時系列的な訪問（Visit）データを管理できるように設計されています。フェーズ1では、基本的なサーベイとVisitの管理機能に焦点を当てます。

## Requirements

### Requirement 1

**User Story:** As a 検査者, I want to create and manage surveys with multiple visits, so that I can organize ophthalmologic examination data in a structured timeline.

#### Acceptance Criteria

1. WHEN a 検査者 creates a new survey THEN the system SHALL provide fields for survey metadata (survey name, description, creation date)
2. WHEN a 検査者 adds visits to a survey THEN the system SHALL allow defining visit schedules (baseline, 1 week, 1 month, etc.) with unique visit identifiers
3. WHEN a 検査者 views existing surveys THEN the system SHALL display a list with survey names, creation dates, and visit counts
4. WHEN a 検査者 selects a survey THEN the system SHALL show all associated visits in chronological order

### Requirement 2

**User Story:** As a 検査者, I want to input comprehensive ophthalmologic examination data through structured forms, so that I can capture all required clinical measurements efficiently.

#### Acceptance Criteria

1. WHEN a 検査者 starts data entry for a visit THEN the system SHALL present a multi-step form with 6 examination groups: 前眼部検査, 問診, VAS, フィッティング検査, 涙濡れ性検査, FACE2
2. WHEN entering 前眼部検査 data THEN the system SHALL provide fields for both eyes including: 装用前/現在使用CL, 角膜曲率半径(R1/R2), 屈折検査(VA/S/C/Ax), 優位眼
3. WHEN entering 前眼部検査 data THEN the system SHALL provide scoring fields (0-4 scale) for both eyes: 角膜ステイニング, 角膜浮腫, 角膜血管新生, 球結膜充血, 眼瞼結膜充血, 上眼瞼乳頭増殖, 下眼瞼濾胞, 球結膜染色, その他
4. WHEN entering フィッティング検査 data THEN the system SHALL provide detailed fitting assessment fields including lens movement, centering, and comfort ratings for both eyes

### Requirement 3

**User Story:** As a 検査者, I want to save draft data and resume data entry later, so that I can handle interruptions during examination sessions without losing data.

#### Acceptance Criteria

1. WHEN a 検査者 is entering data THEN the system SHALL automatically save draft data every 30 seconds
2. WHEN a 検査者 manually saves a draft THEN the system SHALL store the current form state and display a confirmation message
3. WHEN a 検査者 returns to an incomplete visit THEN the system SHALL restore all previously entered data and highlight incomplete sections
4. WHEN a 検査者 completes all required fields THEN the system SHALL allow final submission and change status from "draft" to "completed"

### Requirement 4

**User Story:** As a 検査者, I want to view and navigate through examination data efficiently, so that I can review previous visits and track patient progress.

#### Acceptance Criteria

1. WHEN a 検査者 views a completed visit THEN the system SHALL display all examination data in a read-only format organized by examination groups
2. WHEN a 検査者 navigates between visits THEN the system SHALL provide clear navigation controls showing visit dates and completion status
3. WHEN a 検査者 compares visits THEN the system SHALL highlight changes in key measurements between visits
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