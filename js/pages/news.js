import { api } from '../modules/api.js';
import { formatDate } from '../modules/utils.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const newsContainer = document.getElementById('news-container');
    const articleContainer = document.getElementById('article-container');
    const filterSelect = document.getElementById('news-filter');
    const refreshInterval = 20 * 60 * 1000;

    function escapeHtml(value = '') {
        return String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
    }

    async function loadSingleArticle(slug) {
        try {
            const res = await api.get(`/api/public/news/${slug}`);
            const article = res?.data || res;
            if (!article || !article.title) throw new Error('Article not found');

            if (newsContainer) newsContainer.style.display = 'none';
            if (filterSelect) filterSelect.style.display = 'none';
            if (articleContainer) {
                articleContainer.style.display = 'block';
                articleContainer.innerHTML = `
                    <button class="btn btn-secondary" onclick="window.location.hash=''; window.location.reload();" style="margin-bottom:1.5rem;">&larr; Back to News</button>
                    <h2 style="font-family:'Lora',serif; font-size:2rem; margin-bottom:0.5rem;">${article.title}</h2>
                    <p class="meta" style="color:var(--text-secondary); margin-bottom:1.5rem;">${formatDate(article.created_at || article.publishedAt)} | ${article.category || 'General'}</p>
                    <div class="content">${article.body || article.content || ''}</div>
                `;
            }
        } catch (error) {
            showToast('Article not found', 'error');
            window.location.hash = '';
        }
    }

    async function loadNewsList(category = '') {
        if (newsContainer) newsContainer.innerHTML = '<p class="empty-state">Loading live news...</p>';
        try {
            const endpoint = category ? `/api/public/live-news?category=${category}` : '/api/public/live-news';
            const res = await api.get(endpoint);
            const news = res && res.ok && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            
            if (newsContainer) {
                if (news.length === 0) {
                    newsContainer.innerHTML = '<p class="empty-state">Live news is temporarily unavailable. Please refresh shortly.</p>';
                    return;
                }
                newsContainer.innerHTML = news.map(article => `
                    <div class="card hoverable" style="padding:1.5rem; margin-bottom:1.5rem;">
                        <h3 style="font-family:'Lora',serif; margin-bottom:0.5rem;"><a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a></h3>
                        <p style="color:var(--text-tertiary); font-size:0.875rem;">${escapeHtml(formatDate(article.publishedAt))} &bull; ${escapeHtml(article.source)} &bull; ${escapeHtml(article.category)}</p>
                        <div class="news-source-meta" title="${escapeHtml(article.sourceProfile?.note || '')}">
                            <span><strong>Political spectrum:</strong> ${escapeHtml(article.sourceProfile?.politicalSpectrum || 'Not classified')}</span>
                            <span><strong>Propaganda risk:</strong> ${escapeHtml(article.sourceProfile?.propagandaRisk || 'Not rated')}</span>
                            <a href="${escapeHtml(article.sourceProfile?.indexUrl || 'https://adfontesmedia.com/interactive-media-bias-chart/')}" target="_blank" rel="noopener noreferrer">Based on ${escapeHtml(article.sourceProfile?.indexName || 'Ad Fontes Media Bias Chart')}</a>
                        </div>
                        <p style="margin-top:0.75rem;">${escapeHtml(article.description || 'Read the original article on the publisher website.')}</p>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load news:', error);
            if (newsContainer) newsContainer.innerHTML = '<p class="empty-state">Live news is temporarily unavailable. Please refresh shortly.</p>';
            showToast('Live news is temporarily unavailable', 'error');
        }
    }

    function refreshNews() {
        if (!window.location.hash) loadNewsList(filterSelect?.value || '');
    }

    const hash = window.location.hash.substring(1);
    if (hash) {
        loadSingleArticle(hash);
    } else {
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                loadNewsList(e.target.value);
            });
        }
        loadNewsList();
        window.setInterval(refreshNews, refreshInterval);
    }
    
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1);
        if (newHash) {
            loadSingleArticle(newHash);
        } else {
            if (newsContainer) newsContainer.style.display = 'block';
            if (filterSelect) filterSelect.style.display = 'block';
            if (articleContainer) articleContainer.style.display = 'none';
            loadNewsList();
        }
    });
}
