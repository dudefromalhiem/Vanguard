import { api } from '../modules/api.js';
import { openModal } from '../modules/modal.js';

const inductionImages = Array.from({ length: 13 }, (_, index) => ({
    url: `./images/gallery/induction-program/induction-program-${String(index + 1).padStart(2, '0')}.jpeg`,
    caption: 'Induction Program'
}));

const localAlbum = {
    id: 'induction-program',
    title: 'Induction Program',
    year: '2026',
    cover_image: inductionImages[0].url,
    images: inductionImages
};

export async function init() {
    const galleryContainer = document.getElementById('gallery-container');
    const wingFilter = document.getElementById('wing-filter');
    const yearFilter = document.getElementById('year-filter');
    const albumsById = new Map([[localAlbum.id, localAlbum]]);

    function renderAlbums(albums) {
        const wing = wingFilter?.value || '';
        const year = yearFilter?.value || '';
        const filteredAlbums = albums.filter((album) => (!wing || album.wing === wing) && (!year || String(album.year) === year));
        galleryContainer.innerHTML = filteredAlbums.length ? filteredAlbums.map((album) => `
            <button class="card hoverable gallery-album-card" type="button" data-album-id="${album.id}" aria-label="Open ${album.title} gallery">
                <img src="${album.cover_image || album.coverImage || album.images?.[0]?.url || './vanguardlogo.jpeg'}" alt="${album.title}" loading="lazy">
                <span class="gallery-album-content">
                    <strong>${album.title}</strong>
                    <span>${album.year || ''} &bull; ${album.images?.length || 0} photos</span>
                </span>
            </button>
        `).join('') : '<p style="color:var(--text-secondary);">No gallery albums found.</p>';
    }

    async function loadAlbums() {
        let remoteAlbums = [];
        try {
            const res = await api.get('/api/public/gallery');
            remoteAlbums = res?.ok && Array.isArray(res.data) ? res.data : [];
        } catch (error) {
            console.warn('Gallery API unavailable; showing local albums.', error);
        }
        const albums = [localAlbum, ...remoteAlbums.filter((album) => album.id !== localAlbum.id)];
        albums.forEach((album) => albumsById.set(String(album.id), album));
        renderAlbums(albums);
    }

    window.openAlbum = (albumId) => {
        const album = albumsById.get(String(albumId));
        const modalContent = document.getElementById('lightbox-content');
        const modalTitle = document.getElementById('lightbox-title');
        const modalCount = document.getElementById('lightbox-count');
        if (!album || !modalContent) return;
        if (modalTitle) modalTitle.textContent = album.title || 'Gallery Album';
        if (modalCount) modalCount.textContent = `${(album.images || []).length} photos`;
        modalContent.innerHTML = `
            <h2>${album.title || 'Gallery Album'}</h2>
            <div class="image-grid">
                ${(album.images || []).map((image) => {
                    const item = typeof image === 'string' ? { url: image } : image;
                    return `<img src="${item.url}" alt="${item.caption || album.title || ''}" loading="lazy" style="max-width:100%; border-radius:4px;">`;
                }).join('')}
            </div>
        `;
        openModal('lightbox');
    };

    galleryContainer?.addEventListener('click', (event) => {
        const card = event.target.closest('[data-album-id]');
        if (card) window.openAlbum(card.dataset.albumId);
    });
    wingFilter?.addEventListener('change', loadAlbums);
    yearFilter?.addEventListener('change', loadAlbums);
    await loadAlbums();
}
