async function protectRoute(allowedRoles) {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }

    const role = await checkUserRole(user.uid);
    if (!allowedRoles.includes(role)) {
        window.location.href = '/unauthorized.html';
        return false;
    }

    return true;
}

// Usage in protected pages
document.addEventListener('DOMContentLoaded', async () => {
    // For artist pages
    if (window.location.pathname.includes('/artist/')) {
        await protectRoute(['artist', 'admin']);
    }
    
    // For admin pages
    if (window.location.pathname.includes('/admin/')) {
        await protectRoute(['admin']);
    }
}); 