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
  generateBrief: () => apiCall('/api/generate-brief', {}),
  generateIdea: (pillar?: string, platform?: string) => apiCall('/api/generate-idea', { pillar, platform }),
  generateDraft: (ideaId: string) => apiCall('/api/generate-draft', { ideaId }),
  generateCarousel: (title: string, slideCount: number) => apiCall('/api/generate-carousel', { title, slideCount }),
  health: () => apiCall('/api/health'),
};
