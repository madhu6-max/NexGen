const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('agrilink_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  getDemoUsers: () => request('/auth/demo-users'),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  googleLogin: (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Farmers
  getFarmerDashboard: (id) => request(`/farmers/${id}/dashboard`),
  getFarmerProfile: (id) => request(`/farmers/${id}`),
  updateFarmerProfile: (id, data) => request(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyFarmerStep: (id, data) => request(`/farmers/${id}/verify-step`, { method: 'POST', body: JSON.stringify(data) }),
  verifyAllFarmerSteps: (id) => request(`/farmers/${id}/verify-all`, { method: 'POST' }),

  // Buyers
  getBuyerDashboard: (id) => request(`/buyers/${id}/dashboard`),
  getBuyerProfile: (id) => request(`/buyers/${id}`),
  updateBuyerProfile: (id, data) => request(`/buyers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyBuyer: (id, data = {}) => request(`/buyers/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  // Crops & Market Intelligence
  getCrops: () => request('/crops'),
  getCrop: (id) => request(`/crops/${id}`),
  getMarketIntelligence: (cropId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/crops/${cropId}/market-intelligence?${q}`);
  },

  // Produce
  getProduceList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/produce?${q}`);
  },
  getProduceDetail: (id) => request(`/produce/${id}`),
  createProduce: (data) => request('/produce', { method: 'POST', body: JSON.stringify(data) }),
  updateProduce: (id, data) => request(`/produce/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyProduce: (id) => request(`/produce/${id}/verify`, { method: 'POST' }),

  // Requirements
  getRequirements: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/requirements?${q}`);
  },
  getRequirementDetail: (id) => request(`/requirements/${id}`),
  createRequirement: (data) => request('/requirements', { method: 'POST', body: JSON.stringify(data) }),
  updateRequirement: (id, data) => request(`/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Matching Engine (Bidirectional: Buyers & Farmers)
  getMatchesForRequirement: (reqId) => request(`/matching/requirement/${reqId}`),
  getMatchesForProduce: (produceId) => request(`/matching/produce/${produceId}`),
  getFarmerMatches: (farmerId) => request(`/matching/farmer/${farmerId}`),
  getBrowseMatches: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/matching/browse?${q}`);
  },
  sendFarmerProposal: (data) => request('/matching/farmer-proposal', { method: 'POST', body: JSON.stringify(data) }),

  // Purchase Requests & Negotiations
  getRequests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/requests?${q}`);
  },
  getRequestDetail: (id) => request(`/requests/${id}`),
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  counterOffer: (id, data) => request(`/requests/${id}/counter`, { method: 'PUT', body: JSON.stringify(data) }),
  farmerAcceptRequest: (id) => request(`/requests/${id}/farmer-accept`, { method: 'PUT' }),
  farmerRejectRequest: (id, data) => request(`/requests/${id}/farmer-reject`, { method: 'PUT', body: JSON.stringify(data) }),
  buyerConfirmOrder: (id, data = {}) => request(`/requests/${id}/buyer-confirm`, { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/orders?${q}`);
  },
  getOrderDetail: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  verifyOrderQuality: (id) => request(`/orders/${id}/quality-verification`, { method: 'POST' }),
  confirmDeliveryInspection: (id, data) => request(`/orders/${id}/delivery-confirmation`, { method: 'POST', body: JSON.stringify(data) }),
  fulfillOrder: (id, data) => request(`/orders/${id}/fulfill`, { method: 'POST', body: JSON.stringify(data) }),

  // Payments & Checkout (Razorpay Real & COD)
  getPaymentConfig: () => request('/payments/config'),
  createPaymentOrder: (data) => request('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentReceipt: (orderId) => request(`/payments/receipt/${orderId}`),
  getOrderTransactions: (orderId) => request(`/payments/order/${orderId}/transactions`),

  // Deliveries & GPS
  getDelivery: (orderId) => request(`/deliveries/${orderId}`),
  stepDeliveryRoute: (id, data = {}) => request(`/deliveries/${id}/step`, { method: 'PUT', body: JSON.stringify(data) }),

  // Returns & Replacements
  getReturns: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/returns?${q}`);
  },
  getReturnDetail: (id) => request(`/returns/${id}`),
  reportReturnIssue: (data) => request('/returns', { method: 'POST', body: JSON.stringify(data) }),
  farmerResponseReturn: (id, data) => request(`/returns/${id}/farmer-response`, { method: 'PUT', body: JSON.stringify(data) }),
  adminResolveReturn: (id, data) => request(`/returns/${id}/admin-resolve`, { method: 'PUT', body: JSON.stringify(data) }),

  // Ratings
  submitRating: (data) => request('/ratings', { method: 'POST', body: JSON.stringify(data) }),
  getUserRatings: (userId) => request(`/ratings/user/${userId}`),

  // Notifications
  getNotifications: (userId) => request(`/notifications/${userId}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (userId) => request('/notifications/mark-all-read', { method: 'POST', body: JSON.stringify({ userId }) }),
  simulateNotification: (data) => request('/notifications/simulate', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminOverview: () => request('/admin/overview'),
  getAdminAnalytics: () => request('/admin/analytics'),
  cleanResetDatabase: () => request('/admin/clean-reset', { method: 'POST' }),
  restoreDemoDatabase: () => request('/admin/restore-demo', { method: 'POST' })
};
