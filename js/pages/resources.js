import { api } from '../modules/api.js';
import { debounce } from '../modules/utils.js'; // Assuming debounce exists or I can implement it

// Fallback debounce
function fallbackDebounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export async function init() {
    const resourcesContainer = document.getElementById('resources-container');
    const searchInput = document.getElementById('search-input');
    const wingFilter = document.getElementById('wing-filter');
    const categoryFilter = document.getElementById('category-filter');

    async function loadResources() {
        try {
            const params = new URLSearchParams();
            if (searchInput && searchInput.value) params.append('q', searchInput.value);
            if (wingFilter && wingFilter.value) params.append('wingId', wingFilter.value);
            if (categoryFilter && categoryFilter.value) params.append('category', categoryFilter.value);
            
            const qs = params.toString();
            const resources = await api.get(`/api/resources${qs ? '?' + qs : ''}`);
            renderResources(resources);
        } catch (error) {
            console.error('Error loading resources:', error);
            if (resourcesContainer) resourcesContainer.innerHTML = '<p>Failed to load resources.</p>';
        }
    }

    function renderResources(resources) {
        if (!resourcesContainer) return;
        if (resources.length === 0) {
            resourcesContainer.innerHTML = '<p>No resources found.</p>';
            return;
        }

        resourcesContainer.innerHTML = resources.map(res => `
            <div class="resource-card">
                <h3>${res.title}</h3>
                <p class="meta">${res.category || 'General'} ${res.wing ? '| ' + res.wing : ''}</p>
                <p>${res.description || ''}</p>
                <a href="${res.url}" target="_blank" class="btn" download="${res.isDownloadable ? true : false}">Access Resource</a>
            </div>
        `).join('');
    }

    if (searchInput) {
        searchInput.addEventListener('input', fallbackDebounce(loadResources, 300));
    }
    if (wingFilter) wingFilter.addEventListener('change', loadResources);
    if (categoryFilter) categoryFilter.addEventListener('change', loadResources);

    loadResources();
}
