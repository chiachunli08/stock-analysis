import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const companyApi = {
  getAll: (page = 1, pageSize = 50) => 
    api.get(`/api/companies?page=${page}&page_size=${pageSize}`),
  
  getByCode: (stockCode: string) => 
    api.get(`/api/companies/${stockCode}`),
  
  getFinancialReports: (stockCode: string, years?: number) => 
    api.get(`/api/companies/${stockCode}/financial-reports${years ? `?years=${years}` : ''}`),
  
  getTrend: (stockCode: string) => 
    api.get(`/api/companies/${stockCode}/trend`),
};

export const screenerApi = {
  screen: (filters: object, page = 1, pageSize = 50) => 
    api.post(`/api/screener?page=${page}&page_size=${pageSize}`, filters),
};

export const metaApi = {
  getIndustries: () => api.get('/api/industries'),
  getSignals: () => api.get('/api/signals'),
};

export default api;
