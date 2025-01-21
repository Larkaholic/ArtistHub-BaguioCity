function navToEvent(path) {
    // Remove any double slashes that might occur
    const cleanPath = path.replace(/\/\//g, '/');
    
    // Handle both local and GitHub Pages paths
    const basePath = window.location.hostname === "127.0.0.1" || 
                    window.location.hostname === "localhost"
        ? ''  // Local development
        : 'ArtistHub-BaguioCity'; // GitHub Pages (add your repo name if needed)
    
    window.location.href = basePath + cleanPath;
} 