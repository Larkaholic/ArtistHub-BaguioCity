// Test function to simulate bot behavior
async function testHoneypot() {
    // Fill both visible and hidden fields
    document.getElementById('registerEmail').value = 'test@example.com';
    document.getElementById('registerPassword').value = 'password123';
    document.getElementById('artistTrap').value = 'something'; // Bot filling hidden field
    
    // Submit the form
    const form = document.getElementById('loginFormElement');
    form.dispatchEvent(new Event('submit'));
} 