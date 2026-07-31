import { api } from '../modules/api.js';
import { groupBy } from '../modules/utils.js';

export async function init() {
    const teamContainer = document.getElementById('team-container');
    const tabsContainer = document.getElementById('team-tabs');

    if (!teamContainer || !tabsContainer) return;

    try {
        const teamMembers = await api.get('/api/team');
        const grouped = groupBy(teamMembers, 'category');
        
        // Define tab order
        const categories = ['Executive', 'Faculty', 'Mentors', 'Coordinators', 'Past'];
        
        // Render tabs
        tabsContainer.innerHTML = categories.map((cat, i) => `
            <button class="tab-btn ${i === 0 ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </button>
        `).join('');

        // Render content
        function renderCategory(category) {
            const members = grouped[category] || [];
            teamContainer.innerHTML = members.map(m => `
                <div class="team-card">
                    <img src="${m.imageUrl || '/images/default-avatar.png'}" alt="${m.name}">
                    <h3>${m.name}</h3>
                    <p class="role">${m.role}</p>
                    <p class="bio">${m.bio || ''}</p>
                </div>
            `).join('');
        }

        // Init first tab
        renderCategory(categories[0]);

        // Event delegation for tabs
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderCategory(e.target.getAttribute('data-category'));
            }
        });

    } catch (error) {
        console.error('Failed to load team data:', error);
        teamContainer.innerHTML = '<p>Could not load team members.</p>';
    }
}
