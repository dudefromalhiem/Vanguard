import { api } from '../modules/api.js';
import { formatDate } from '../modules/utils.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const newsContainer = document.getElementById('news-container');
    const articleContainer = document.getElementById('article-container');
    const filterSelect = document.getElementById('news-filter');

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
        try {
            const endpoint = category ? `/api/public/news?category=${category}` : '/api/public/news';
            const res = await api.get(endpoint);
            const news = res && res.ok && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            
            if (newsContainer) {
                if (news.length === 0) {
                    newsContainer.innerHTML = '<p style="color:var(--text-secondary);">No articles published yet.</p>';
                    return;
                }
                newsContainer.innerHTML = news.map(article => `
                    <div class="card hoverable" style="padding:1.5rem; margin-bottom:1.5rem;">
                        <h3 style="font-family:'Lora',serif; margin-bottom:0.5rem;"><a href="#${article.id || article.slug}">${article.title}</a></h3>
                        <p style="color:var(--text-tertiary); font-size:0.875rem;">${formatDate(article.created_at || article.publishedAt)} &bull; ${article.category || 'General'}</p>
                        <p style="margin-top:0.75rem;">${article.summary || (article.body ? article.body.substring(0, 150) + '...' : '')}</p>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load news:', error);
            showToast('Failed to load news', 'error');
        }
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
