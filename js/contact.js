(function() {
    emailjs.init("aT4EjzdlZ0AtGEjIR"); // Your public key
})();

// Form submission handler
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');
    const submitButton = document.querySelector('#contactModal button[type="submit"]');

    // Basic validation
    if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
        alert('Please fill in all fields');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        alert('Please enter a valid email address');
        return;
    }

    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
        const response = await emailjs.send(
            "service_900b2jh",
            "template_yruw07c",
            {
                from_name: nameInput.value,
                from_email: emailInput.value,
                message: messageInput.value,
                to_name: "Artist Hub Admin",
                subject: "New Contact Form Message"
            }
        );

        // Show success message
        alert('Message sent successfully!');
        
        // Clear form
        event.target.reset();
        
        // Close modal
        closeContactModal();

    } catch (error) {
        console.error('Email send failed:', error);
        alert('Failed to send message. Please try again later.');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Send';
    }
}

// Attach form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('#contactModal form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
});

// Modal control functions
function openContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('hidden');
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('hidden');
}

// Make functions globally available
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
