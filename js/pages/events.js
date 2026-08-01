import { api } from '../modules/api.js';
import { formatDate, buildQueryString } from '../modules/utils.js';
import { createCalendar } from '../modules/calendar.js';
import { openModal, closeModal } from '../modules/modal.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const calendarContainer = document.getElementById('calendar-container');
    const eventsList = document.getElementById('events-list');
    const filterForm = document.getElementById('event-filters');

    async function loadEvents(filters = {}) {
        try {
            const qs = buildQueryString(filters);
            const res = await api.get(`/api/public/events${qs ? '?' + qs : ''}`);
            const events = res && res.ok && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            renderEvents(events);
            if (calendarContainer) {
                createCalendar(calendarContainer, events, {
                    onClick: (event) => showEventDetail(event)
                });
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            showToast('Failed to load events', 'error');
        }
    }

    function renderEvents(events) {
        if (!eventsList) return;
        if (!Array.isArray(events) || events.length === 0) {
            eventsList.innerHTML = '<p style="color:var(--text-secondary);">No upcoming events scheduled at the moment.</p>';
            return;
        }
        eventsList.innerHTML = events.map(e => `
            <div class="card hoverable" style="padding:1.5rem; margin-bottom:1rem; cursor:pointer;" onclick="window.showEventDetail('${e.id}')">
                <h3 style="font-family:'Lora',serif; margin-bottom:0.5rem;">${e.title}</h3>
                <p style="color:var(--text-secondary); font-size:0.875rem;">📅 ${formatDate(e.event_date || e.date)} ${e.location ? '&bull; 📍 ' + e.location : ''}</p>
                <p style="color:var(--text-tertiary); font-size:0.875rem; margin-top:0.5rem;">${e.description || ''}</p>
            </div>
        `).join('');
    }

    window.showEventDetail = async (eventId) => {
        try {
            const event = await api.get(`/api/events/${eventId}`);
            document.getElementById('modal-title').textContent = event.title;
            document.getElementById('modal-desc').textContent = event.description;
            document.getElementById('modal-date').textContent = formatDate(event.date);
            
            const registerBtn = document.getElementById('register-btn');
            if (registerBtn) {
                registerBtn.onclick = () => registerForEvent(eventId);
            }
            
            const icsBtn = document.getElementById('generate-ics-btn');
            if (icsBtn) {
                icsBtn.onclick = () => generateICS(event);
            }

            const gcalBtn = document.getElementById('generate-gcal-btn');
            if (gcalBtn) {
                gcalBtn.href = generateGCalUrl(event);
                gcalBtn.target = '_blank';
            }

            openModal('event-modal');
        } catch (error) {
            showToast('Event details not found', 'error');
        }
    };

    async function registerForEvent(eventId) {
        try {
            await api.post(`/api/events/${eventId}/register`);
            showToast('Successfully registered!', 'success');
            closeModal('event-modal');
        } catch (error) {
            showToast('Registration failed', 'error');
        }
    }

    function generateGCalUrl(event) {
        const start = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const url = new URL('https://calendar.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', event.title);
        url.searchParams.append('dates', `${start}/${end}`);
        url.searchParams.append('details', event.description);
        return url.toString();
    }

    function generateICS(event) {
        const start = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${event.title}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (filterForm) {
        filterForm.addEventListener('change', (e) => {
            const formData = new FormData(filterForm);
            loadEvents(Object.fromEntries(formData.entries()));
        });
    }

    loadEvents();
}
