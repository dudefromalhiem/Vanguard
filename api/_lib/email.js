/**
 * Email notification foundation using Resend.
 * This module sets up the structure for email notifications.
 * Actual sending is gated behind the RESEND_API_KEY env var —
 * if not configured, emails are logged but not sent.
 */

let resendClient = null;

async function getResend() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  // Dynamic import to avoid errors if resend isn't installed yet
  try {
    const { Resend } = await import('resend');
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch {
    console.warn('Resend package not available — emails will be logged only');
    return null;
  }
}

const FROM_EMAIL = 'The Vanguard Society <noreply@vanguard.nie.ac.in>';

/**
 * Send an email. Falls back to console.log if Resend isn't configured.
 */
export async function sendEmail({ to, subject, html, text }) {
  const resend = await getResend();

  if (!resend) {
    console.log('[EMAIL STUB]', { to, subject, text: text || '(html email)' });
    return { success: true, stub: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });
    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    return { success: false, error: err.message };
  }
}

// --- Pre-built notification templates ---

export async function notifyNewEvent(event, recipientEmails) {
  return sendEmail({
    to: recipientEmails,
    subject: `New Event: ${event.title}`,
    html: `<h2>${event.title}</h2>
           <p>${event.description}</p>
           <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString()}</p>
           <p><strong>Location:</strong> ${event.location || 'TBA'}</p>`,
    text: `New Event: ${event.title}\n${event.description}\nDate: ${event.event_date}\nLocation: ${event.location || 'TBA'}`
  });
}

export async function notifyNewPoll(poll, recipientEmails) {
  return sendEmail({
    to: recipientEmails,
    subject: `New Poll: ${poll.question}`,
    html: `<h2>New Poll</h2><p>${poll.question}</p><p>Cast your vote now!</p>`,
    text: `New Poll: ${poll.question}\nCast your vote now!`
  });
}

export async function notifyNewsPublished(article, recipientEmails) {
  return sendEmail({
    to: recipientEmails,
    subject: `${article.title} — The Vanguard Society`,
    html: `<h2>${article.title}</h2><p>${article.body?.substring(0, 200)}...</p>`,
    text: `${article.title}\n${article.body?.substring(0, 200)}...`
  });
}

export async function notifyApplicationStatus(application, status) {
  const subject = status === 'accepted'
    ? 'Welcome to The Vanguard Society!'
    : 'Membership Application Update';

  return sendEmail({
    to: application.email,
    subject,
    html: `<h2>${subject}</h2>
           <p>Dear ${application.name},</p>
           <p>Your membership application status has been updated to: <strong>${status}</strong></p>`,
    text: `${subject}\nDear ${application.name},\nYour application status: ${status}`
  });
}

export async function notifyEventRegistration(registration, event) {
  return sendEmail({
    to: registration.email,
    subject: `Registration Confirmed: ${event.title}`,
    html: `<h2>Registration Confirmed</h2>
           <p>You're registered for <strong>${event.title}</strong></p>
           <p>Your ticket code: <strong>${registration.ticket_code}</strong></p>
           <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString()}</p>`,
    text: `Registration Confirmed: ${event.title}\nTicket: ${registration.ticket_code}\nDate: ${event.event_date}`
  });
}
