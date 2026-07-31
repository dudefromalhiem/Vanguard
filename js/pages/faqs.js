import { api } from '../modules/api.js';

export async function init() {
  const container = document.getElementById('faq-accordion');
  const searchInput = document.getElementById('faq-search');
  let faqs = [];

  async function fetchFaqs() {
    try {
      const res = await api.get('/api/public/faqs');
      if (res.success) {
        faqs = res.data;
        renderFaqs();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderFaqs() {
    if (!container) return;
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = faqs.filter(f => f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term));
    
    container.innerHTML = filtered.map((f, i) => `
      <div class="faq-item">
        <button class="faq-question" data-index="${i}">${f.question}</button>
        <div class="faq-answer" style="display: none;">${f.answer}</div>
      </div>
    `).join('');

    container.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const answer = e.target.nextElementSibling;
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderFaqs);
  }

  fetchFaqs();
}
