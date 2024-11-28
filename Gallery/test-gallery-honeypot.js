// Gallery honeypot test suite
async function runGalleryHoneypotTests() {
    console.group('Running Gallery Upload Honeypot Tests');

    // Test 1: Legitimate User Upload
    console.log('Test 1: Legitimate User Upload');
    try {
        const legitResult = await testGalleryUpload({
            honeypot: ''
        });
        console.log('Legitimate upload:', legitResult ? 'Passed ✅' : 'Failed ❌');
    } catch (error) {
        console.error('Legitimate test failed:', error);
    }

    // Test 2: Bot Detection
    console.log('Test 2: Bot Detection');
    try {
        const botResult = await testGalleryUpload({
            honeypot: 'bot_input'
        });
        console.log('Bot detection:', !botResult ? 'Passed ✅' : 'Failed ❌');
    } catch (error) {
        console.error('Bot test failed:', error);
    }

    console.groupEnd();
}

async function testGalleryUpload(data) {
    // Check if upload widget exists
    const uploadButton = document.getElementById('upload_widget');
    if (!uploadButton) {
        throw new Error('Upload widget not found');
    }

    // Set honeypot
    const honeypotField = document.createElement('input');
    honeypotField.type = 'hidden';
    honeypotField.id = 'galleryTrap';
    honeypotField.value = data.honeypot;
    document.body.appendChild(honeypotField);

    // Track upload attempt
    let wasSuccessful = false;
    const originalAlert = window.alert;
    window.alert = (msg) => {
        wasSuccessful = msg.includes('successful');
    };

    // Simulate upload click
    uploadButton.click();

    // Wait a bit for potential bot detection
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cleanup
    window.alert = originalAlert;
    honeypotField.remove();

    return wasSuccessful;
}

// Add test button in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    const testBtn = document.createElement('button');
    testBtn.innerHTML = 'Test Gallery Honeypot';
    testBtn.onclick = runGalleryHoneypotTests;
    testBtn.className = 'fixed bottom-16 right-4 bg-black/50 text-white px-4 py-2 rounded';
    document.body.appendChild(testBtn);
}

// Make it available globally
window.runGalleryHoneypotTests = runGalleryHoneypotTests; 