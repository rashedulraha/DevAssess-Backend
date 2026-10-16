import axios from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_PROD_API_URL ||
  'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  },
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    role: 'CANDIDATE' | 'RECRUITER';
    companyName?: string;
  }) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
};

export const problemApi = {
  getAll: async (params?: Record<string, string | number>) => {
    const res = await apiClient.get('/problems', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/problems/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/problems', data);
    return res.data;
  },
};

export const assessmentApi = {
  getAll: async (params?: Record<string, string | number>) => {
    const res = await apiClient.get('/assessments', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/assessments', data);
    return res.data;
  },
  invite: async (assessmentId: string, candidates: Array<{ email: string; candidateName?: string }>) => {
    const res = await apiClient.post(`/assessments/${assessmentId}/invite`, { candidates });
    return res.data;
  },
  getReport: async (assessmentId: string) => {
    const res = await apiClient.get(`/assessments/${assessmentId}/report`);
    return res.data;
  },
};

export const attemptApi = {
  getMyInvitations: async () => {
    const res = await apiClient.get('/invitations/my');
    return res.data;
  },
  start: async (invitationToken: string) => {
    const res = await apiClient.post('/attempts/start', { invitationToken });
    return res.data;
  },
  submitAnswer: async (attemptId: string, payload: { problemId: string; codeAnswer?: string; selectedOptionId?: string; writtenAnswer?: string }) => {
    const res = await apiClient.post(`/attempts/${attemptId}/submissions`, payload);
    return res.data;
  },
  logAntiCheat: async (attemptId: string, eventType: string, metadata?: any) => {
    const res = await apiClient.post(`/attempts/${attemptId}/anti-cheat`, { eventType, metadata });
    return res.data;
  },
  finalize: async (attemptId: string) => {
    const res = await apiClient.post(`/attempts/${attemptId}/finalize`, {});
    return res.data;
  },
};

export const paymentApi = {
  initiate: async (bundle: 'STARTER_25' | 'PRO_100' | 'ENTERPRISE_300', provider: 'STRIPE' = 'STRIPE') => {
    const res = await apiClient.post('/payments/initiate', { bundle, provider });
    return res.data;
  },
  testCheckout: async (transactionId: string) => {
    const res = await apiClient.post('/payments/test-checkout', { transactionId });
    return res.data;
  },
};

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get('/admin/dashboard-stats');
    return res.data;
  },
  getUsers: async (params?: Record<string, string | number>) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },
  getAuditLogs: async (params?: Record<string, string | number>) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },
};
