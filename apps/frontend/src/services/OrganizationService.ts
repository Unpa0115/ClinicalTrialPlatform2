import { OrganizationRecord } from '@clinical-trial/shared';
import { authService } from './AuthService';

export interface CreateOrganizationRequest {
  organizationName: string;
  organizationCode: string;
  organizationType: OrganizationRecord['organizationType'];
  address: {
    country: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
  };
  phoneNumber: string;
  email: string;
  website?: string;
  principalInvestigator: string;
  studyCoordinator: string;
  contactPerson: string;
  maxPatientCapacity: number;
  availableEquipment: string[];
  certifications: string[];
}

export interface UpdateOrganizationRequest {
  organizationName?: string;
  organizationType?: OrganizationRecord['organizationType'];
  address?: {
    country: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
  };
  phoneNumber?: string;
  email?: string;
  website?: string;
  principalInvestigator?: string;
  studyCoordinator?: string;
  contactPerson?: string;
  maxPatientCapacity?: number;
  availableEquipment?: string[];
  certifications?: string[];
  status?: OrganizationRecord['status'];
  approvalDate?: string;
}

export class OrganizationService {
  private baseUrl = 'http://localhost:3001/api/organizations';

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

  async createOrganization(data: CreateOrganizationRequest): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganizations(params?: {
    status?: string;
  }): Promise<{ success: boolean; organizations: OrganizationRecord[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);

    const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
    return this.request(url);
  }

  async getOrganizationById(organizationId: string): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}`);
  }

  async updateOrganization(organizationId: string, data: UpdateOrganizationRequest): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateOrganizationStatus(organizationId: string, status: OrganizationRecord['status']): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateOrganizationCapacity(organizationId: string, maxPatientCapacity: number): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/capacity`, {
      method: 'PUT',
      body: JSON.stringify({ maxPatientCapacity }),
    });
  }

  async addStudyToOrganization(organizationId: string, studyId: string): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/studies`, {
      method: 'POST',
      body: JSON.stringify({ studyId }),
    });
  }

  async removeStudyFromOrganization(organizationId: string, studyId: string): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/studies/${studyId}`, {
      method: 'DELETE',
    });
  }

  async updateOrganizationEquipment(organizationId: string, availableEquipment: string[]): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/equipment`, {
      method: 'PUT',
      body: JSON.stringify({ availableEquipment }),
    });
  }

  async updateOrganizationCertifications(organizationId: string, certifications: string[]): Promise<{ success: boolean; organization: OrganizationRecord }> {
    return this.request(`${this.baseUrl}/${organizationId}/certifications`, {
      method: 'PUT',
      body: JSON.stringify({ certifications }),
    });
  }

  async getOrganizationStatistics(organizationId: string): Promise<{ success: boolean; statistics: any }> {
    return this.request(`${this.baseUrl}/${organizationId}/statistics`);
  }

  async deleteOrganization(organizationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.baseUrl}/${organizationId}`, {
      method: 'DELETE',
    });
  }
}

export const organizationService = new OrganizationService();