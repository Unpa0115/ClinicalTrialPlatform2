import { ClinicalStudyRecord, VisitTemplate, ExaminationConfig } from '@clinical-trial/shared';
import { authService } from './AuthService';

export interface CreateClinicalStudyRequest {
  studyName: string;
  studyCode: string;
  description: string;
  studyType: 'interventional' | 'observational' | 'registry';
  phase: 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'not_applicable';
  primaryObjective: string;
  secondaryObjectives?: string[];
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  targetOrganizations: string[];
  plannedEnrollment: number;
  estimatedDuration: number;
  visitTemplate: VisitTemplate[];
}

export interface UpdateClinicalStudyRequest {
  studyName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetOrganizations?: string[];
  maxPatientsPerOrganization?: number;
  totalTargetPatients?: number;
  visitTemplate?: VisitTemplate[];
  examinations?: ExaminationConfig[];
  status?: ClinicalStudyRecord['status'];
  currentPhase?: string;
  protocolVersion?: string;
  ethicsApprovalNumber?: string;
  regulatoryApprovals?: string[];
}

export class ClinicalStudyService {
  private baseUrl = 'http://localhost:3001/api/clinical-studies';

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const token = await authService.getAccessToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createClinicalStudy(data: CreateClinicalStudyRequest): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStudies(params?: {
    status?: string;
    organizationId?: string;
  }): Promise<{ success: boolean; studies: ClinicalStudyRecord[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);

    const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
    return this.request(url);
  }

  async getStudyById(studyId: string): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}`);
  }

  async updateClinicalStudy(studyId: string, data: UpdateClinicalStudyRequest): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateStudyStatus(studyId: string, status: ClinicalStudyRecord['status']): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateVisitTemplate(studyId: string, visitTemplate: VisitTemplate[]): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}/visit-template`, {
      method: 'PUT',
      body: JSON.stringify({ visitTemplate }),
    });
  }

  async addOrganizationToStudy(studyId: string, organizationId: string): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}/organizations`, {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  async removeOrganizationFromStudy(studyId: string, organizationId: string): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}/organizations/${organizationId}`, {
      method: 'DELETE',
    });
  }

  async generateSurveyFromTemplate(studyId: string, data: {
    organizationId: string;
    patientId: string;
    baselineDate: string;
  }): Promise<{ success: boolean; survey: any }> {
    return this.request(`${this.baseUrl}/${studyId}/surveys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEnrollmentCount(studyId: string, enrolledPatients: number): Promise<{ success: boolean; study: ClinicalStudyRecord }> {
    return this.request(`${this.baseUrl}/${studyId}/enrollment`, {
      method: 'PUT',
      body: JSON.stringify({ enrolledPatients }),
    });
  }

  async deleteClinicalStudy(studyId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.baseUrl}/${studyId}`, {
      method: 'DELETE',
    });
  }
}

export const clinicalStudyService = new ClinicalStudyService();