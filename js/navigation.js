import { VOICEFLOW_API_KEY } from './config.js';
import { auth } from './firebase-config.js';

export function initNavigation() {
    window.navToEvent = function(path) {
        try {
            if (path.startsWith('/')) {
                window.location.href = path;
                return;
            }
            const baseUrl = window.location.hostname.includes() 

                ? '/'
                : '';

            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const hasAnchor = cleanPath.includes('#');

            if (hasAnchor) {
                const [pagePath, anchor] = cleanPath.split('#');
                if (pagePath === '.' || pagePath === './index.html' || pagePath === window.location.pathname) {
                    const element = document.getElementById(anchor);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        return;
                    }
                }
                window.location.href = `/${cleanPath}`;
            } else {
                window.location.href = `/${cleanPath}`;
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };
}

// Profile navigation handling
window.handleProfileNavigation = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            const authCheck = new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });
            const finalUser = await authCheck;
            if (!finalUser) {
                alert('Please login to view your profile');
                toggleLoginFlyout();
                return;
            }
        }
        
        const baseUrl = window.location.hostname === 'larkaholic.github.io' 
            ? '/'
            : '';
            
        const profileUrl = `/profile/profile.html?id=${auth.currentUser.uid}`;
        window.location.href = profileUrl;
    } catch (error) {
        console.error('Profile navigation error:', error);
        alert('There was an error accessing your profile. Please try again.');
    }
};

// Mobile profile link handling
document.addEventListener('DOMContentLoaded', () => {
    const mobileProfileLink = document.querySelector('#flyout-menu [onclick*="profile"]');
    if (mobileProfileLink) {
        mobileProfileLink.onclick = (e) => {
            e.preventDefault();
            handleProfileNavigation();
        };
    }
});