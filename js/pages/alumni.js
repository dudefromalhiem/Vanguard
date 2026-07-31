import { api } from '../modules/api.js';

export async function init() {
  const container = document.getElementById('alumni-list');
  const mentorshipFilter = document.getElementById('mentorship-filter');
  let alumniData = [];

  async function fetchAlumni() {
    try {
      const res = await api.get('/api/public/alumni');
      if (res.success) {
        alumniData = res.data;
        renderAlumni();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderAlumni() {
    if (!container) return;
    const onlyMentors = mentorshipFilter ? mentorshipFilter.checked : false;
    const filtered = onlyMentors ? alumniData.filter(a => a.is_mentor) : alumniData;
    
    container.innerHTML = filtered.map(a => `
      <div class="alumni-card">
        ${a.avatar ? `<img src="${a.avatar}" alt="${a.name}">` : ''}
        <h3>${a.name}</h3>
        <p>${a.bio || ''}</p>
        ${a.is_mentor ? '<span class="mentor-badge">Available for Mentorship</span>' : ''}
      </div>
    `).join('');
  }

  if (mentorshipFilter) {
    mentorshipFilter.addEventListener('change', renderAlumni);
  }

  fetchAlumni();
}
