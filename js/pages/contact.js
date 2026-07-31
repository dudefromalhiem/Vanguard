import { api } from '../modules/api.js';
import { handleSubmit, validateForm } from '../modules/forms.js';
import { showToast } from '../modules/notifications.js';

export async function init() {
    const contactForm = document.getElementById('contact-form');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(contactForm)) {
            showToast('Please fill out all required fields correctly.', 'error');
            return;
        }

        try {
            // Check if API works, otherwise fallback to mailto
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                await api.post('/api/contact', data);
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
            } catch (apiError) {
                console.warn('API submission failed, falling back to mailto', apiError);
                // Fallback to mailto link
                const subject = encodeURIComponent(`Contact Form Submission: ${data.subject || 'Inquiry'}`);
                const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`);
                window.location.href = `mailto:contact@vanguardsociety.com?subject=${subject}&body=${body}`;
                showToast('Opening default email client...', 'info');
            }

        } catch (error) {
            console.error('Contact form error', error);
        }
    });
}
