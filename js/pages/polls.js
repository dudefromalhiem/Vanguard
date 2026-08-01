import { api } from '../modules/api.js';
import { showToast } from '../modules/notifications.js';
import { isMember } from '../modules/auth.js';

function compressImageFile(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function init() {
    const activePollsContainer = document.getElementById('active-polls');
    const pastPollsContainer = document.getElementById('past-polls');

    async function loadPolls() {
        try {
            const res = await api.get('/api/public/polls');
            if (!res.ok) throw new Error(res.error);
            const polls = res.data;
            const official = polls.filter(p => p.status === 'Active' && p.tags && p.tags.includes('official'));
            const community = polls.filter(p => p.status === 'Active' && (!p.tags || !p.tags.includes('official')));
            const past = polls.filter(p => p.status === 'Closed');

            renderPollList(document.getElementById('official-polls-list'), official, 'No official society polls active at the moment.');
            renderPollList(document.getElementById('community-polls-list'), community, 'No community polls active. Click below to launch one!');
            renderPastPolls(past);
        } catch (error) {
            console.error('Error loading polls:', error);
            showToast('Failed to load polls', 'error');
        }
    }

    function renderPollList(listDiv, polls, emptyText) {
        if (!listDiv) return;
        
        if (polls.length === 0) {
            listDiv.innerHTML = `<p style="color:var(--text-secondary);">${emptyText}</p>`;
            return;
        }

        const authenticated = isMember();

        listDiv.innerHTML = polls.map(poll => {
            const voted = localStorage.getItem(`voted_poll_${poll.id}`);
            const imageHtml = poll.image_url ? `<img src="${poll.image_url}" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : '';
            
            if (!authenticated) {
                return `
                    <div class="poll-card">
                        ${imageHtml}
                        <h3>${poll.title}</h3>
                        <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem;">${poll.description || ''}</p>
                        <p style="font-weight:600;">You must <a href="/login.html" style="color:var(--primary-color);">log in</a> to vote.</p>
                    </div>
                `;
            }

            if (voted) {
                return `
                    <div class="poll-card">
                        ${imageHtml}
                        <span class="badge" style="margin-bottom:0.5rem; background: #166534; color:#fff; border:none;">✓ Vote Submitted</span>
                        <h3>${poll.title}</h3>
                        <p style="color:var(--text-secondary);font-size:0.875rem;margin-top:0.5rem;">Thank you for participating! Results will be revealed in Past Polls once this poll closes.</p>
                    </div>
                `;
            }

            return `
                <div class="poll-card" id="poll-${poll.id}">
                    ${imageHtml}
                    <h3>${poll.title}</h3>
                    <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem;">${poll.description || ''}</p>
                    <form onsubmit="window.submitVote(event, '${poll.id}')">
                        ${(poll.poll_options || []).map((opt) => `
                            <div style="margin-bottom:0.5rem;display:flex;align-items:center;gap:0.5rem;">
                                <input type="radio" name="option_id" value="${opt.id}" id="opt-${opt.id}" required>
                                <label for="opt-${opt.id}">${opt.option_text}</label>
                            </div>
                        `).join('')}
                        <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Submit Vote</button>
                    </form>
                </div>
            `;
        }).join('');
    }

    function renderPastPolls(polls) {
        if (!pastPollsContainer) return;
        const listDiv = pastPollsContainer.querySelector('#past-polls-list') || pastPollsContainer;
        
        if (polls.length === 0) {
            listDiv.innerHTML = '<p style="color:var(--text-secondary);">No past polls found.</p>';
            return;
        }

        listDiv.innerHTML = polls.map(poll => {
            const totalVotes = (poll.poll_options || []).reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
            const imageHtml = poll.image_url ? `<img src="${poll.image_url}" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : '';

            return `
                <div class="poll-card" style="border: 1px solid var(--border-color); padding: 1.5rem;">
                    ${imageHtml}
                    <span class="badge" style="margin-bottom: 0.5rem;">Closed Poll</span>
                    <h3>${poll.title}</h3>
                    <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1rem;">${poll.description || ''}</p>
                    <div class="chart" style="margin-top:1rem;">
                        ${(poll.poll_options || []).map(opt => {
                            const percent = totalVotes === 0 ? 0 : Math.round(((opt.vote_count || 0) / totalVotes) * 100);
                            return `
                                <div class="bar-row" style="margin-bottom:0.75rem;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                                        <span style="font-size:0.875rem;font-weight:500;">${opt.option_text}</span>
                                        <span style="font-size:0.875rem;font-weight:600;">${percent}% (${opt.vote_count || 0})</span>
                                    </div>
                                    <div style="background:var(--border-color);height:8px;border-radius:4px;overflow:hidden;">
                                        <div style="background:var(--primary-color);height:100%;width:${percent}%;transition:width 1s ease;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-tertiary);">Final Result &bull; Total votes: ${totalVotes}</p>
                </div>
            `;
        }).join('');
    }

    window.submitVote = async (e, pollId) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const optionId = formData.get('option_id');

        if (!optionId) return;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            const res = await api.post('/api/public/polls', { poll_id: pollId, option_id: optionId });
            if (res.ok) {
                localStorage.setItem(`voted_poll_${pollId}`, 'true');
                showToast('Vote submitted successfully!', 'success');
                loadPolls(); // reload
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            showToast(error.message || 'Failed to submit vote', 'error');
            btn.disabled = false;
            btn.textContent = 'Submit Vote';
        }
    };

    // Ensure we wait for auth state before rendering
    setTimeout(() => {
        loadPolls();
    }, 100);

    // Inline Public Community Poll Creation Form
    const pollForm = document.getElementById('form-public-create-poll');

    if (pollForm) {
        pollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = document.getElementById('public-poll-question').value;
            const options = document.getElementById('public-poll-options').value;
            const durationHours = document.getElementById('public-poll-duration')?.value || '24';
            const mediaUrlInput = document.getElementById('public-poll-media-url')?.value || '';
            const fileInput = document.getElementById('public-poll-file');

            const submitBtn = pollForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Poll...';

            let finalImageUrl = mediaUrlInput;

            if (fileInput && fileInput.files && fileInput.files[0]) {
                finalImageUrl = await compressImageFile(fileInput.files[0]);
            }

            try {
                const res = await api.post('/api/public/polls', {
                    title: question,
                    options: options,
                    duration_hours: durationHours,
                    image_url: finalImageUrl
                });

                if (res.ok) {
                    showToast('Community Poll created successfully!', 'success');
                    pollForm.reset();
                    loadPolls();
                } else {
                    throw new Error(res.error || 'Failed to create poll');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Poll';
            }
        });
    }
}
