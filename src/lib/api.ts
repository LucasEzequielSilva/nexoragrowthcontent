const API_URL = 'http://localhost:3001';

async function apiCall(endpoint: string, body?: any) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  analyzeContent: (contentId: string) => apiCall('/api/analyze', { contentId }),
  analyzeBatch: (competitorId?: string) => apiCall('/api/analyze-batch', { competitorId }),
  generateBrief: () => apiCall('/api/generate-brief', {}),
  generateIdea: (pillar?: string, platform?: string) => apiCall('/api/generate-idea', { pillar, platform }),
  generateDraft: (ideaId: string) => apiCall('/api/generate-draft', { ideaId }),
  generateCarousel: (title: string, slideCount: number) => apiCall('/api/generate-carousel', { title, slideCount }),
  scrapeCompetitor: (competitorId: string, platform: string, maxPosts = 20) =>
    apiCall('/api/scrape-competitor', { competitorId, platform, maxPosts }),
  scrapeAll: (competitorId: string, maxPosts = 15) =>
    apiCall('/api/scrape-all', { competitorId, maxPosts }),
  getBusinessProfile: () => apiCall('/api/business-profile'),
  saveBusinessProfile: (profile: any) =>
    fetch(`${API_URL}/api/business-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).then(r => r.json()),
  getCreatorProfile: (userId: string) => apiCall(`/api/creator-profile?userId=${userId}`),
  saveCreatorProfile: (profile: any) =>
    fetch(`${API_URL}/api/creator-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).then(r => r.json()),
  health: () => apiCall('/api/health'),
};
