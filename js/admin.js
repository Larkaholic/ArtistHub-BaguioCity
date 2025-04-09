import { checkAdminAccess } from '../js/utils.js';

async function someAdminFunction() {
    if (!(await checkAdminAccess())) return;
    
    console.log('Performing admin action...');
}

window.someAdminFunction = someAdminFunction; 