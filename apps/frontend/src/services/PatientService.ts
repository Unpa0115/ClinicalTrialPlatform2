import { PatientRecord } from '@clinical-trial/shared';
import { authService } from './AuthService';

export interface CreatePatientRequest {
  patientCode: string;
  patientInitials?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  registeredOrganizationId: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
  };
}

export interface UpdatePatientRequest {
  patientInitials?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
  };
  status?: PatientRecord['status'];
}

export interface PatientSearchOptions {
  organizationId?: string;
  patientCodePrefix?: string;
  status?: PatientRecord['status'];
  limit?: number;
  exclusiveStartKey?: any;
}

export class PatientService {
  private baseUrl = 'http://localhost:3001/api/patients';

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
      console.error('API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createPatient(data: CreatePatientRequest): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchPatients(options: PatientSearchOptions): Promise<{ 
    success: boolean; 
    patients: PatientRecord[]; 
    pagination: { lastEvaluatedKey?: any } 
  }> {
    const searchParams = new URLSearchParams();
    if (options.organizationId) searchParams.append('organizationId', options.organizationId);
    if (options.patientCodePrefix) searchParams.append('patientCodePrefix', options.patientCodePrefix);
    if (options.status) searchParams.append('status', options.status);
    if (options.limit) searchParams.append('limit', options.limit.toString());
    if (options.exclusiveStartKey) searchParams.append('exclusiveStartKey', JSON.stringify(options.exclusiveStartKey));

    const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
    
    const token = await authService.getAccessToken();
    console.log('Patient search request:', {
      url,
      options,
      token: token ? 'present' : 'missing'
    });
    
    return this.request(url);
  }

  async getPatientsByOrganization(organizationId: string): Promise<{ success: boolean; patients: PatientRecord[] }> {
    return this.searchPatients({ organizationId });
  }

  async getPatientById(patientId: string): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}`);
  }

  async updatePatient(patientId: string, data: UpdatePatientRequest): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePatientStatus(patientId: string, status: PatientRecord['status']): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updatePatientMedicalInfo(patientId: string, data: {
    medicalHistory?: string[];
    currentMedications?: string[];
    allergies?: string[];
  }): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}/medical-info`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePatientContactInfo(patientId: string, contactInfo: PatientRecord['contactInfo']): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}/contact-info`, {
      method: 'PUT',
      body: JSON.stringify({ contactInfo }),
    });
  }

  async assignPatientToSurvey(patientId: string, data: {
    clinicalStudyId: string;
    organizationId: string;
    baselineDate: string;
  }): Promise<{ success: boolean; survey: any }> {
    return this.request(`${this.baseUrl}/${patientId}/assign-survey`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removePatientFromStudy(patientId: string, studyId: string): Promise<{ success: boolean; patient: PatientRecord }> {
    return this.request(`${this.baseUrl}/${patientId}/studies/${studyId}`, {
      method: 'DELETE',
    });
  }

  async getPatientParticipation(patientId: string): Promise<{ success: boolean; participation: any }> {
    return this.request(`${this.baseUrl}/${patientId}/participation`);
  }

  async getOrganizationPatientStatistics(organizationId: string): Promise<{ success: boolean; statistics: any }> {
    return this.request(`${this.baseUrl}/organizations/${organizationId}/statistics`);
  }

  async deletePatient(patientId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.baseUrl}/${patientId}`, {
      method: 'DELETE',
    });
  }
}

export const patientService = new PatientService();