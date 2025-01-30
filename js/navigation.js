// function navToEvent(path) {
//     // Remove any double slashes that might occur
//     const cleanPath = path.replace(/\/\//g, '/');
    
//     // Handle both local and GitHub Pages paths
//     const basePath = window.location.hostname === "127.0.0.1" || 
//                     window.location.hostname === "localhost"
//         ? ''  // Local development
//         : ''; // GitHub Pages (add your repo name if needed)
    
//     window.location.href = basePath + cleanPath;
// } 

export function getBasePath() {
    return window.location.hostname.includes('github.io') ? '/ArtistHub-BaguioCity' : '';
}

export function navToEvent(url) {
    const basePath = getBasePath();
    // Remove leading slash if present
    url = url.replace(/^\//, '');
    window.location.href = `${basePath}/${url}`;
}