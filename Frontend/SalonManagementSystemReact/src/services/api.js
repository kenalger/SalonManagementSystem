import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7014',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const developerApi = {
  getStats:           ()     => api.get('/api/developer/stats'),
  getUsers:           ()     => api.get('/api/developer/users'),
  createUser:         (data) => api.post('/api/developer/users', data),
  toggleUserActive:   (id)   => api.patch(`/api/developer/users/${id}/toggle-active`),
  changeRole:         (id, role) => api.patch(`/api/developer/users/${id}/role`, { role }),
  getOrganizations:   ()          => api.get('/api/developer/organizations'),
  createOrganization: (data)      => api.post('/api/developer/organizations', data),
  updateOrg:          (id, data)  => api.put(`/api/developer/organizations/${id}`, data),
  toggleOrgActive:    (id)        => api.patch(`/api/developer/organizations/${id}/toggle-active`),
  addOrgMember:       (id, data)  => api.post(`/api/developer/organizations/${id}/members`, data),
  addOrgBranch:       (id, data)  => api.post(`/api/developer/organizations/${id}/branches`, data),
  getOrgMembers:      (id)        => api.get(`/api/developer/organizations/${id}/members`),
  getOrgBranches:     (id)        => api.get(`/api/developer/organizations/${id}/branches`),
};

export const serviceTypesApi = {
  getAll:        (params)  => api.get('/api/servicetypes', { params }),
  getById:       (id)      => api.get(`/api/servicetypes/${id}`),
  create:        (data)    => api.post('/api/servicetypes', data),
  update:        (id, data)=> api.put(`/api/servicetypes/${id}`, data),
  toggleActive:  (id)      => api.patch(`/api/servicetypes/${id}/toggle-active`),
  duplicate:     (id)      => api.post(`/api/servicetypes/${id}/duplicate`),
  delete:        (id)      => api.delete(`/api/servicetypes/${id}`),
  getMetrics:    (orgId)   => api.get('/api/servicetypes/metrics', { params: { orgId } }),
};

export const organizationsApi = {
  getMembers: (orgId) => api.get(`/api/organizations/${orgId}/members`),
};

export const branchesApi = {
  getByOrganization: (orgId) => api.get('/api/branches', { params: { orgId } }),
};


export const quotaApi = {
  getReport:       (params)      => api.get('/api/quota', { params }),
  exportReport:    (params)      => api.get('/api/quota', { params: { ...params, export: true } }),
  getDashboard:    (orgId, branchId, month, year) => api.get('/api/quota/dashboard', { params: { orgId, branchId, month, year } }),
  getTopPerformers:(orgId, branchId, limit) => api.get('/api/quota/top-performers', { params: { orgId, branchId, limit } }),
  create:          (data)        => api.post('/api/quota', data),
  update:          (id, data)    => api.put(`/api/quota/${id}`, data),
  updateProgress:  (id, data)    => api.patch(`/api/quota/${id}/progress`, data),
  toggleActive:    (id)          => api.patch(`/api/quota/${id}/toggle-active`),
};

export const reportsApi = {
  getSummary:   (orgId, startDate, endDate) =>
    api.get('/api/reports/summary', { params: { orgId, startDate, endDate } }),
  getByService: (orgId, startDate, endDate) =>
    api.get('/api/reports/by-service', { params: { orgId, startDate, endDate } }),
  getByBranch:  (orgId, startDate, endDate) =>
    api.get('/api/reports/by-branch', { params: { orgId, startDate, endDate } }),
};

export const bookingsApi = {
  getBookings:       (params)        => api.get('/api/bookings', { params }),
  createBooking:     (data)          => api.post('/api/bookings', data),
  updateBooking:     (id, data)      => api.put(`/api/bookings/${id}`, data),
  updateStatus:      (id, data)      => api.patch(`/api/bookings/${id}/status`, data),
  reschedule:        (id, data)      => api.patch(`/api/bookings/${id}/reschedule`, data),
  cancel:            (id, reason)    => api.delete(`/api/bookings/${id}`, { params: { reason } }),
  getAvailableStaff: (params)        => api.get('/api/bookings/available-staff', { params }),
  getNextSlot:       (params)        => api.get('/api/bookings/next-slot', { params }),
  getDashboard:      (params)        => api.get('/api/bookings/dashboard', { params }),
  getServices:       (orgId)         => api.get('/api/bookings/services', { params: { orgId } }),
  getOrgStaff:       (orgId)         => api.get('/api/bookings/org-staff', { params: { orgId } }),
  getBranches:       (orgId)         => api.get('/api/bookings/branches', { params: { orgId } }),
};

export const clientsApi = {
  getAll:          (orgId, params) => api.get('/api/clients', { params: { orgId, ...params } }),
  getById:         (id)            => api.get(`/api/clients/${id}`),
  create:          (data)          => api.post('/api/clients', data),
  update:          (id, data)      => api.put(`/api/clients/${id}`, data),
  toggleActive:    (id)            => api.patch(`/api/clients/${id}/toggle-active`),
  getPending:      (orgId)         => api.get('/api/clients/pending', { params: { orgId } }),
  approveDiscount: (id, data)      => api.post(`/api/clients/${id}/approve-discount`, data),
};

export default api;
