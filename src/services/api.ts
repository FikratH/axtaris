const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.axtaris.az';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { token });
  }

  post<T>(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request<T>(endpoint, { method: 'POST', body, token });
  }

  put<T>(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  }

  patch<T>(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request<T>(endpoint, { method: 'PATCH', body, token });
  }

  delete<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const apiClient = new ApiClient(API_BASE);
