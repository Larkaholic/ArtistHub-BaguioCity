// Save this as a separate test file
async function runHoneypotTests() {
    console.group('Running Honeypot Tests');

    // Test 1: Legitimate User
    console.log('Test 1: Legitimate User Registration');
    try {
        const legitResult = await testRegistration({
            email: 'legitimate@test.com',
            password: 'password123',
            honeypot: ''
        });
        console.log('Legitimate registration:', legitResult ? 'Passed ✅' : 'Failed ❌');
    } catch (error) {
        console.error('Legitimate test failed:', error);
    }

    // Test 2: Bot Detection
    console.log('Test 2: Bot Detection');
    try {
        const botResult = await testRegistration({
            email: 'bot@test.com',
            password: 'password123',
            honeypot: 'bot_input'
        });
        console.log('Bot detection:', !botResult ? 'Passed ✅' : 'Failed ❌');
    } catch (error) {
        console.error('Bot test failed:', error);
    }

    console.groupEnd();
}

async function testRegistration(data) {
    // Fill form
    document.getElementById('registerEmail').value = data.email;
    document.getElementById('registerPassword').value = data.password;
    document.getElementById('artistTrap').value = data.honeypot;

    // Track form submission
    let wasSuccessful = false;
    const originalAlert = window.alert;
    window.alert = (msg) => {
        wasSuccessful = msg.includes('successful');
    };

    // Submit form
    await document.getElementById('loginFormElement')
        .dispatchEvent(new Event('submit'));

    // Restore original alert
    window.alert = originalAlert;

    return wasSuccessful;
}

// Run tests
runHoneypotTests(); 