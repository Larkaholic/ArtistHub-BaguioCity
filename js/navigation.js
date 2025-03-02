(function() {
    window.navToEvent = function(path) {
        try {
            // If the path already starts with /ArtistHub-BaguioCity/, use it as is
            if (path.startsWith('/ArtistHub-BaguioCity/')) {
                window.location.href = path;
                return;
            }

            // Get the base URL for GitHub Pages or local development
            const baseUrl = window.location.hostname.includes('github.io') 
                ? '/ArtistHub-BaguioCity'
                : '';

            // Remove leading slash if present to avoid double slashes
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;

            // Check if the path contains an anchor
            const hasAnchor = cleanPath.includes('#');

            if (hasAnchor) {
                const [pagePath, anchor] = cleanPath.split('#');

                // If we're already on the correct page, just scroll to anchor
                if (pagePath === '.' || pagePath === './index.html' || pagePath === window.location.pathname) {
                    const element = document.getElementById(anchor);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        return;
                    }
                }

                // Navigate to new page with anchor
                window.location.href = `${baseUrl}/${cleanPath}`;
            } else {
                // Regular page navigation
                window.location.href = `${baseUrl}/${cleanPath}`;
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };
})();

window.handleProfileNavigation = () => {
    const user = auth.currentUser;
    if (user) {
        window.location.href = `${baseUrl}/profile/profile.html?id=${user.uid}`;
    } else {
        alert('Please login to view your profile');
        toggleLoginFlyout();
    }
};