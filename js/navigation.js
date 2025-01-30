(function() {
    window.navToEvent = function(path) {
        try {
            // Get the base URL for GitHub Pages or local development
            const baseUrl = window.location.hostname === 'Larkaholic.github.io' 
                ? '/ArtistHub-BaguioCity'
                : '';
            
            // Check if the path contains an anchor
            const hasAnchor = path.includes('#');
            
            if (hasAnchor) {
                const [pagePath, anchor] = path.split('#');
                
                // If we're already on the correct page, just scroll to anchor
                if (pagePath === '.' || pagePath === './index.html' || pagePath === window.location.pathname) {
                    const element = document.getElementById(anchor);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        return;
                    }
                }
                
                // Navigate to new page with anchor
                window.location.href = baseUrl + path;
            } else {
                // Regular page navigation
                window.location.href = baseUrl + path;
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };
})();