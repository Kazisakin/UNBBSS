const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_URL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('adminToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Fix: Use Record<string, string> for proper typing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Admin authentication
  async adminLogin(email: string) {
    const data = await this.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  // Event management
  async createEvent(eventData: any) {
    return this.request('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getEvents() {
    return this.request('/api/admin/events');
  }
  // Nomination methods
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
}

export const apiClient = new ApiClient();