export function getBasePath() {
    return window.location.hostname.includes('github.io') ? '/ArtistHub-BaguioCity' : '';
}

export function ensureStylesLoaded(requiredStyles) {
    console.log('Checking styles:', requiredStyles);
    
    requiredStyles.forEach(style => {
        // Check if style is already loaded
        const existingLink = document.querySelector(`link[href$="${style}"]`);
        if (!existingLink) {
            console.log('Loading missing style:', style);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = style;
            
            // Add load event listener
            link.onload = () => console.log('Style loaded:', style);
            link.onerror = () => console.error('Style failed to load:', style);
            
            document.head.appendChild(link);
        }
    });
}

export function navToEvent(url) {
    const basePath = getBasePath();
    // Remove leading slash if present
    url = url.replace(/^\//, '');
    window.location.href = `${basePath}/${url}`;
} 