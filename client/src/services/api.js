import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => config, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0] ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Members
export const memberAPI = {
  getAll: (params) => api.get('/members', { params }),
  getOne: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

// Trainers
export const trainerAPI = {
  getAll: (params) => api.get('/trainers', { params }),
  getOne: (id) => api.get(`/trainers/${id}`),
  create: (data) => api.post('/trainers', data),
  update: (id, data) => api.put(`/trainers/${id}`, data),
  delete: (id) => api.delete(`/trainers/${id}`),
};

// Membership Plans
export const membershipAPI = {
  getAll: (params) => api.get('/memberships', { params }),
  getOne: (id) => api.get(`/memberships/${id}`),
  create: (data) => api.post('/memberships', data),
  update: (id, data) => api.put(`/memberships/${id}`, data),
  delete: (id) => api.delete(`/memberships/${id}`),
  toggleStatus: (id, status) => api.put(`/memberships/${id}`, { status }),
};

// Member Memberships (assignments)
export const memberMembershipAPI = {
  getAll: (params) => api.get('/member-memberships', { params }),
  create: (data) => api.post('/member-memberships', data),
  update: (id, data) => api.put(`/member-memberships/${id}`, data),
  renew: (id, data) => api.post(`/member-memberships/${id}/renew`, data),
  cancel: (id, data) => api.put(`/member-memberships/${id}/cancel`, data),
  delete: (id) => api.delete(`/member-memberships/${id}`),
};

// Membership Requests
export const membershipRequestAPI = {
  getAll: (params) => api.get('/membership-requests', { params }),
  create: (data) => api.post('/membership-requests', data),
  approve: (id, data) => api.put(`/membership-requests/${id}/approve`, data),
  reject: (id, data) => api.put(`/membership-requests/${id}/reject`, data),
};

// Member Self-Data
export const memberDataAPI = {
  getProfile: () => api.get('/member-data/profile'),
  updateProfile: (data) => api.put('/member-data/profile', data),
  getActiveMembership: () => api.get('/member-data/active-membership'),
  getMembershipHistory: () => api.get('/member-data/membership-history'),
  getMembership: () => api.get('/member-data/membership'),
  getAttendance: (params) => api.get('/member-data/attendance', { params }),
  getWorkout: () => api.get('/member-data/workout'),
};

// Workout Plans
export const workoutAPI = {
  getAll: (params) => api.get('/workouts', { params }),
  getOne: (id) => api.get(`/workouts/${id}`),
  create: (data) => api.post('/workouts', data),
  update: (id, data) => api.put(`/workouts/${id}`, data),
  delete: (id) => api.delete(`/workouts/${id}`),
};

// Attendance
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenueByPlan: () => api.get('/dashboard/revenue-by-plan'),
  getMembersPerTrainer: () => api.get('/dashboard/members-per-trainer'),
  getMonthlyRevenue: () => api.get('/dashboard/monthly-revenue'),
  getDailyAttendance: () => api.get('/dashboard/daily-attendance'),
  getRecentMembers: () => api.get('/dashboard/recent-members'),
  getRecentAttendance: () => api.get('/dashboard/recent-attendance'),
};

// AI
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
};

// Notifications (admin)
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
};

export default api;
