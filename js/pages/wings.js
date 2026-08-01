import { api } from '../modules/api.js';
import { formatDate } from '../modules/utils.js';

export async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const wingId = urlParams.get('id');

    if (!wingId) return;

    try {
        const [wingRes, teamRes, eventsRes, resourcesRes] = await Promise.all([
            api.get(`/api/public/wings/${wingId}`),
            api.get(`/api/public/team?wingId=${wingId}`),
            api.get(`/api/public/events?wingId=${wingId}&limit=5`),
            api.get(`/api/public/resources?wingId=${wingId}&limit=5`)
        ]);

        const wing = wingRes?.data || wingRes || {};
        const team = teamRes && teamRes.ok && Array.isArray(teamRes.data) ? teamRes.data : (Array.isArray(teamRes) ? teamRes : []);
        const events = eventsRes && eventsRes.ok && Array.isArray(eventsRes.data) ? eventsRes.data : (Array.isArray(eventsRes) ? eventsRes : []);
        const resources = resourcesRes && resourcesRes.ok && Array.isArray(resourcesRes.data) ? resourcesRes.data : (Array.isArray(resourcesRes) ? resourcesRes : []);

        const titleEl = document.getElementById('wing-title');
        const descEl = document.getElementById('wing-description');
        const teamContainer = document.getElementById('wing-team');
        const eventsContainer = document.getElementById('wing-events');
        const resourcesContainer = document.getElementById('wing-resources');

        if (titleEl) titleEl.textContent = wing.name || 'Wing';
        if (descEl) descEl.textContent = wing.description || '';

        if (teamContainer) {
            teamContainer.innerHTML = team.map(member => `
                <div class="team-member">
                    <h4>${member.name}</h4>
                    <p>${member.role}</p>
                </div>
            `).join('');
        }

        if (eventsContainer) {
            eventsContainer.innerHTML = events.map(event => `
                <div class="event-item">
                    <h5>${event.title}</h5>
                    <span>${formatDate(event.date)}</span>
                </div>
            `).join('');
        }

        if (resourcesContainer) {
            resourcesContainer.innerHTML = resources.map(res => `
                <div class="resource-item">
                    <a href="${res.url}" target="_blank">${res.title}</a>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error fetching wing data:', error);
    }
}
