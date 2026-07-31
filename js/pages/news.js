import { api } from '../modules/api.js';
import { formatDate } from '../modules/utils.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const newsContainer = document.getElementById('news-container');
    const articleContainer = document.getElementById('article-container');
    const filterSelect = document.getElementById('news-filter');

    async function loadSingleArticle(slug) {
        try {
            const article = await api.get(`/api/news/${slug}`);
            if (newsContainer) newsContainer.style.display = 'none';
            if (filterSelect) filterSelect.style.display = 'none';
            if (articleContainer) {
                articleContainer.style.display = 'block';
                articleContainer.innerHTML = `
                    <button onclick="window.location.hash=''; window.location.reload();">Back to News</button>
                    <h2>${article.title}</h2>
                    <p class="meta">${formatDate(article.publishedAt)} | ${article.category}</p>
                    <div class="content">${article.content}</div>
                `;
            }
        } catch (error) {
            showToast('Article not found', 'error');
            window.location.hash = '';
        }
    }

    async function loadNewsList(category = '') {
        try {
            const endpoint = category ? `/api/news?category=${category}` : '/api/news';
            const news = await api.get(endpoint);
            if (newsContainer) {
                newsContainer.innerHTML = news.map(article => `
                    <div class="news-card">
                        <h3><a href="#${article.slug}">${article.title}</a></h3>
                        <p>${formatDate(article.publishedAt)}</p>
                        <p>${article.summary}</p>
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
