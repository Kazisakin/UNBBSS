export class ApiClient {
  private baseURL: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000' ||'http://localhost:5000/api' ;
    console.log('API Client initialized with baseURL:', this.baseURL);
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('adminToken');
    console.log('Auth token retrieved:', token ? 'Present' : 'None');
    return token;
  }

  private getFallbackError(status: number): string {
    const errorMessages: Record<number, string> = {
      400: 'The information provided seems incorrect. Please check and try again.',
      401: 'Your session has expired. Please log in again.',
      403: "You don't have permission to perform this action.",
      404: "We couldn't find what you're looking for.",
      409: 'This action conflicts with existing data. Please refresh and try again.',
      422: "The information provided couldn't be processed. Please check your input.",
      423: 'Your account has been temporarily locked. Please try again later or contact support.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Our servers are having issues. Please try again in a few moments.',
      502: 'Connection problem. Please check your internet connection.',
      503: 'Service temporarily unavailable. Please try again soon.',
      504: 'The request is taking too long. Please try again.',
    };

    return errorMessages[status] || `Something went wrong (Error ${status})`;
  }

  private async handleError(response: Response): Promise<never> {
    const responseClone = response.clone();
    let errorData: any = {};

    try {
      const errorText = await responseClone.text();
      if (errorText) {
        errorData = JSON.parse(errorText);
      }
    } catch {
      // If we can't parse the error, we'll use fallback messages
    }

    if (response.status === 401) {
      console.log('401 Unauthorized - clearing token and redirecting');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');

        if (
          window.location.pathname.startsWith('/admin') &&
          !window.location.pathname.includes('/login')
        ) {
          this.showNotification('Session expired. Redirecting to login...', 'info');
          console.log('Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 1500);
        }
      }
    }

    let userMessage: string;
    
    if (errorData?.error && typeof errorData.error === 'string' && errorData.error.trim()) {
      userMessage = errorData.error;
      console.log('Using backend error message:', userMessage);
    } else {
      userMessage = this.getFallbackError(response.status);
      console.log('Using fallback error message:', userMessage);
    }

    this.showNotification(userMessage, 'error');

    const error = new Error(userMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;

    throw error;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof window !== 'undefined') {
      console.log(`[${type.toUpperCase()}]`, message);

      window.dispatchEvent(
        new CustomEvent('api-notification', {
          detail: { message, type },
        })
      );
    }
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    console.log('Request options:', {
      method: options.method || 'GET',
      hasToken: !!token,
      hasBody: !!options.body,
      headers: options.headers,
    });

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      console.log('Making fetch request...');
      const response = await fetch(url, config);

      console.log(`Response: ${response.status} ${response.statusText}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        await this.handleError(response);
      }

      const responseText = await response.text();
      console.log(
        'Success response text:',
        responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      );

      if (!responseText.trim()) {
        console.log('Empty response body, returning empty object');
        return {};
      }

      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON successfully');
        return jsonData;
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.log('Raw response:', responseText);
        throw new Error('Invalid response format from server. Please try again.');
      }
    } catch (error) {
      console.error('Request failed:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (retryCount < this.retryAttempts) {
          console.log(`Network error. Retrying (${retryCount + 1}/${this.retryAttempts})...`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
          return this.request(endpoint, options, retryCount + 1);
        }
        console.error('Network error - is the server running?');
        throw new Error('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
      }

      if (error instanceof Error) {
        throw error;
      }

      console.error('Unknown error type:', typeof error, error);
      throw new Error('Network error. Please check your connection.');
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      console.log('Checking authentication status...');
      const token = this.getAuthToken();
      if (!token) {
        console.log('No token found');
        return false;
      }

      await this.request('/api/admin/profile');
      console.log('Auth check successful');
      return true;
    } catch (error) {
      console.log('Auth check failed:', error);
      return false;
    }
  }

  async login(credentials: { email: string; password: string }) {
    try {
      console.log('Attempting login for:', credentials.email);
      const data = await this.request('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('adminToken', data.token);
        this.showNotification('Login successful!', 'success');
        console.log('Token stored successfully');
      } else {
        console.log('No token in login response');
      }

      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('Logging out...');
      await this.request('/api/admin/logout', {
        method: 'POST',
      });
      this.showNotification('Logged out successfully!', 'success');
      console.log('Logout request successful');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        console.log('Token removed from localStorage');
      }
    }
  }

  async getProfile() {
    console.log('Getting admin profile...');
    return this.request('/api/admin/profile');
  }

  async createNominationEvent(eventData: any) {
    console.log('Creating nomination event...');
    const response = await this.request('/api/admin/nomination-events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    this.showNotification('Nomination event created successfully!', 'success');
    return response;
  }

  async getNominationEvents() {
    console.log('Getting nomination events...');
    return this.request('/api/admin/nomination-events');
  }

  async updateNominationEvent(eventId: string, updates: any) {
    console.log('Updating nomination event:', eventId);
    return this.request(`/api/admin/nomination-events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getNominationSubmissions(eventId: string) {
    console.log('Getting nomination submissions for:', eventId);
    return this.request(`/api/admin/nomination-events/${eventId}/submissions`);
  }

  async getEventSubmissions(eventId: string) {
    console.log('Getting event submissions for:', eventId);
    return this.request(`/api/admin/nomination-events/${eventId}/submissions`);
  }

  async updateEventTimeSettings(eventId: string, settings: any) {
    console.log('Updating time settings for event:', eventId);
    return this.request(`/api/admin/nomination-events/${eventId}/time-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getNominationSuggestions() {
    console.log('Getting nomination suggestions...');
    return this.request('/api/admin/nomination-suggestions');
  }

  async exportNominationData(eventId: string, format: 'csv' | 'json') {
    console.log('Exporting nomination data:', eventId, format);
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/nomination-events/${eventId}/export?format=${format}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(errorData.error || 'Export failed');
    }

    return response;
  }

  async createVotingEvent(eventData: any) {
    console.log('Creating voting event...');
    return this.request('/api/admin/voting-events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getVotingEvents() {
    console.log('Getting voting events...');
    return this.request('/api/admin/voting-events');
  }

  async getVotingResults(eventId: string) {
    console.log('Getting voting results for:', eventId);
    return this.request(`/api/admin/voting-events/${eventId}/results`);
  }

  async updateVotingEvent(eventId: string, updates: any) {
    console.log('Updating voting event:', eventId);
    return this.request(`/api/admin/voting-events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVotingEvent(eventId: string) {
    console.log('Deleting voting event:', eventId);
    return this.request(`/api/admin/voting-events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async extendVotingPeriod(eventId: string, data: { newEndTime: string; reason?: string }) {
    console.log('Extending voting period for:', eventId);
    return this.request(`/api/admin/voting-events/${eventId}/extend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEventDetails(slug: string) {
    return this.request(`/api/nomination/event/${slug}`);
  }

  async requestNominationOtp(email: string, slug: string) {
    return this.request('/api/nomination/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, slug }),
    });
  }

  async verifyNominationOtp(shortCode: string, otp: string) {
    return this.request('/api/nomination/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ shortCode, otp }),
    });
  }

  async submitNomination(nominationData: any) {
    return this.request('/api/nomination/submit', {
      method: 'POST',
      body: JSON.stringify(nominationData),
    });
  }

  async getSession() {
    return this.request('/api/nomination/session');
  }

  async getVotingEventDetails(slug: string) {
    return this.request(`/api/voting/event/${slug}`);
  }

  async requestVotingOtp(email: string, slug: string) {
    return this.request('/api/voting/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, slug }),
    });
  }

  async verifyVotingOtp(token: string, otp: string) {
    return this.request('/api/voting/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ token, otp }),
    });
  }

  async submitVote(voteData: any) {
    return this.request('/api/voting/submit', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async getSystemActivities(params: {
    page?: number;
    limit?: number;
    category?: string;
    severity?: string;
    actorType?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/admin/system-activities${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getSecurityEvents(params: {
    page?: number;
    limit?: number;
    eventType?: string;
    severity?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/admin/security-events${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async testConnection() {
    try {
      console.log('Testing server connection...');
      const response = await fetch(`${this.baseURL}/health`);
      console.log(`Health check response: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Server is healthy:', data);
        return data;
      } else {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();