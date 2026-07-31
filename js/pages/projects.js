import { api } from '../modules/api.js';
import { openModal } from '../modules/modal.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const projectsContainer = document.getElementById('projects-container');
    const filters = document.getElementById('project-filters');

    async function loadProjects() {
        try {
            let qs = '';
            if (filters) {
                const formData = new FormData(filters);
                const params = new URLSearchParams(formData);
                qs = params.toString() ? '?' + params.toString() : '';
            }
            
            const projects = await api.get(`/api/projects${qs}`);
            renderProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            showToast('Failed to load projects', 'error');
        }
    }

    function renderProjects(projects) {
        if (!projectsContainer) return;
        if (projects.length === 0) {
            projectsContainer.innerHTML = '<div class="empty-state">No projects found for the selected criteria.</div>';
            return;
        }
        projectsContainer.innerHTML = projects.map(p => `
            <div class="card hoverable" onclick="window.showProjectDetail('${p.id}')" style="cursor: pointer;">
                <div class="card-body">
                    <span class="badge ${p.status.toLowerCase() === 'completed' ? 'badge-primary' : ''}" style="margin-bottom: 0.5rem;">${p.status}</span>
                    <h3>${p.title}</h3>
                    <p class="text-primary font-serif mb-2" style="font-size: 0.875rem; font-style: italic;">${p.wing || 'Society Project'}</p>
                    <p class="text-secondary" style="font-size: 0.875rem;">${p.summary}</p>
                </div>
                <div class="card-footer" style="display: flex; justify-content: flex-end;">
                    <button class="btn btn-secondary btn-small">View Details</button>
                </div>
            </div>
        `).join('');
    }

    window.showProjectDetail = async (projectId) => {
        try {
            const project = await api.get(`/api/projects/${projectId}`);
            document.getElementById('modal-title').textContent = project.title;
            document.getElementById('modal-status').textContent = project.status;
            document.getElementById('modal-desc').innerHTML = project.description;
            
            const repoLink = document.getElementById('modal-repo-link');
            if (repoLink) {
                if (project.repoUrl) {
                    repoLink.href = project.repoUrl;
                    repoLink.style.display = 'inline-block';
                } else {
                    repoLink.style.display = 'none';
                }
            }
            openModal('project-modal');
        } catch (error) {
            showToast('Failed to load project details', 'error');
        }
    };

    if (filters) {
        filters.addEventListener('change', loadProjects);
    }

    loadProjects();
}
