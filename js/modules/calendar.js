export function createCalendar(container, events = [], options = {}) {
  let currentDate = new Date();
  const { onDayClick, onMonthChange } = options;

  function render() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const eventDays = new Set();
    events.forEach(e => {
      const d = new Date(e.event_date || e.date);
      if (d.getMonth() === month && d.getFullYear() === year) eventDays.add(d.getDate());
    });

    let html = `<div class="calendar">
      <div class="calendar-header">
        <button class="btn btn-small cal-prev">&laquo;</button>
        <span class="calendar-title">${monthName}</span>
        <button class="btn btn-small cal-next">&raquo;</button>
      </div>
      <div class="calendar-grid">
        <div class="cal-day-name">Su</div><div class="cal-day-name">Mo</div>
        <div class="cal-day-name">Tu</div><div class="cal-day-name">We</div>
        <div class="cal-day-name">Th</div><div class="cal-day-name">Fr</div>
        <div class="cal-day-name">Sa</div>`;

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const hasEvent = eventDays.has(d);
      const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      html += `<div class="cal-day ${hasEvent ? 'has-event' : ''} ${isToday ? 'today' : ''}" data-day="${d}">${d}${hasEvent ? '<span class="event-dot"></span>' : ''}</div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;

    container.querySelector('.cal-prev')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); render(); if (onMonthChange) onMonthChange(currentDate); });
    container.querySelector('.cal-next')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); render(); if (onMonthChange) onMonthChange(currentDate); });
    if (onDayClick) container.querySelectorAll('.cal-day:not(.empty)').forEach(el => {
      el.addEventListener('click', () => onDayClick(parseInt(el.dataset.day), currentDate));
    });
  }

  render();
  return { render, setEvents(e) { events = e; render(); }, setDate(d) { currentDate = d; render(); } };
}
