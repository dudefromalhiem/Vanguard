import { api } from '../modules/api.js';

export async function init() {
  const container = document.getElementById('faq-accordion');
  const searchInput = document.getElementById('faq-search');
  let faqs = [];
  const proposalFaqs = [
    { question: 'What does this society do?', answer: 'The Vanguard Society is a multi-wing student development society at NIE Mysuru. It builds civic literacy, communication confidence, leadership presence, and technical capability through learning, structured practice, and cross-wing events.' },
    { question: 'What do you teach?', answer: 'The Society teaches governance, law, taxation, constitutional rights, political ideology, public speaking, debate, leadership, interpersonal skills, and practical digital tools.' },
    { question: 'What are the three wings?', answer: 'The Political Wing focuses on civic and political education. The Leadership and Communication Wing develops speaking, debate, leadership, content, and outreach. The Technical Wing builds and maintains the digital tools used by Society events.' },
    { question: 'Is the Society affiliated with a political party?', answer: 'No. The Society is non-partisan and does not campaign for or promote any political party under its banner.' },
    { question: 'What events does the Society run?', answer: 'Planned signature events include Parliament Week, Constitution Day Special, Election Watch, MUNs, Youth Parliament, and inter-college competitions.' }
  ];

  async function fetchFaqs() {
    try {
      const res = await api.get('/api/public/faqs');
      faqs = res.ok && Array.isArray(res.data) && res.data.length ? res.data : proposalFaqs;
      renderFaqs();
    } catch (e) {
      console.error(e);
      faqs = proposalFaqs;
      renderFaqs();
    }
  }

  function renderFaqs() {
    if (!container) return;
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = faqs.filter(f => f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term));
    
    container.innerHTML = filtered.map((f, i) => `
      <div class="faq-item">
        <button class="faq-question" data-index="${i}">${f.question}</button>
        <div class="faq-answer">${f.answer}</div>
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
