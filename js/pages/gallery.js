import { api } from '../modules/api.js';
import { openModal, closeModal } from '../modules/modal.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const galleryContainer = document.getElementById('gallery-container');
    const wingFilter = document.getElementById('wing-filter');
    const yearFilter = document.getElementById('year-filter');

    async function loadAlbums() {
        try {
            const wing = wingFilter ? wingFilter.value : '';
            const year = yearFilter ? yearFilter.value : '';
            
            const params = new URLSearchParams();
            if (wing) params.append('wingId', wing);
            if (year) params.append('year', year);
            
            const queryString = params.toString();
            const albums = await api.get(`/api/gallery${queryString ? '?' + queryString : ''}`);
            
            renderAlbums(albums);
        } catch (error) {
            console.error('Error loading gallery:', error);
            showToast('Failed to load gallery', 'error');
        }
    }

    function renderAlbums(albums) {
        if (!galleryContainer) return;
        galleryContainer.innerHTML = albums.map(album => `
            <div class="album-card" onclick="window.openAlbum('${album.id}')">
                <img src="${album.coverImage || '/images/default-album.png'}" alt="${album.title}">
                <h3>${album.title}</h3>
                <p>${album.year} ${album.wing ? ' - ' + album.wing : ''}</p>
            </div>
        `).join('');
    }

    window.openAlbum = async (albumId) => {
        try {
            const album = await api.get(`/api/gallery/${albumId}`);
            const modalContent = document.getElementById('lightbox-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <h2>${album.title}</h2>
                    <div class="image-grid">
                        ${album.images.map(img => `
                            <img src="${img.url}" alt="${img.caption || ''}" loading="lazy">
                        `).join('')}
                    </div>
                `;
            }
            openModal('lightbox-modal');
        } catch (error) {
            showToast('Failed to load album images', 'error');
        }
    };

    if (wingFilter) wingFilter.addEventListener('change', loadAlbums);
    if (yearFilter) yearFilter.addEventListener('change', loadAlbums);

    loadAlbums();
}
