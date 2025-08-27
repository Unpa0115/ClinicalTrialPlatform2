import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL configuration
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Axios instance for API calls with authentication and error handling
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.handleAuthenticationError();
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error - API server may be unavailable');
          error.message = 'Network error - please check your connection';
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    // In a real implementation, this would get the token from localStorage, 
    // cookies, or a state management system
    return localStorage.getItem('authToken');
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(): void {
    // In a real implementation, this would redirect to login
    // or trigger a re-authentication flow
    localStorage.removeItem('authToken');
    console.warn('Authentication failed - redirecting to login');
    // window.location.href = '/login';
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    return this.client.get(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    return this.client.delete(url, config);
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<{ data: T }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return BASE_URL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;