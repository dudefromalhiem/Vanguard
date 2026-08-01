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
            const res = await api.get(`/api/public/gallery${queryString ? '?' + queryString : ''}`);
            const albums = res && res.ok && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            
            renderAlbums(albums);
        } catch (error) {
            console.error('Error loading gallery:', error);
            showToast('Failed to load gallery', 'error');
        }
    }

    function renderAlbums(albums) {
        if (!galleryContainer) return;
        if (!Array.isArray(albums) || albums.length === 0) {
            galleryContainer.innerHTML = '<p style="color:var(--text-secondary);">No gallery albums found.</p>';
            return;
        }
        galleryContainer.innerHTML = albums.map(album => `
            <div class="card hoverable" onclick="window.openAlbum('${album.id}')" style="padding:1.5rem; cursor:pointer;">
                <img src="${album.cover_image || album.coverImage || '/images/default-album.png'}" alt="${album.title}" style="width:100%; max-height:180px; object-fit:cover; border-radius:4px; margin-bottom:0.75rem;">
                <h3 style="font-family:'Lora',serif; margin-bottom:0.25rem;">${album.title}</h3>
                <p style="color:var(--text-secondary); font-size:0.875rem;">${album.year || ''} ${album.wing ? ' &bull; ' + album.wing : ''}</p>
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
