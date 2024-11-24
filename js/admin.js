import { checkAdminAccess } from '../js/utils.js';

// Example of protecting an admin function
async function someAdminFunction() {
    if (!(await checkAdminAccess())) return;
    
    // Admin-only code here
    console.log('Performing admin action...');
}

// Make it globally available
window.someAdminFunction = someAdminFunction; 