export function getBasePath() {
    return window.location.hostname.includes('github.io') ? '/ArtistHub-BaguioCity' : '';
}

export function ensureStylesLoaded(requiredStyles) {
    requiredStyles.forEach(style => {
        const existingLink = document.querySelector(`link[href$="${style}"]`);
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = style;
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