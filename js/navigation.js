import { VOICEFLOW_API_KEY } from './config.js';
import { auth } from './firebase-config.js';

export function initNavigation() {
    // Make navToEvent globally available
    window.navToEvent = function(path) {
        try {
            if (path.startsWith('/ArtistHub-BaguioCity/')) {
                window.location.href = path;
                return;
            }

            const baseUrl = window.location.hostname.includes('github.io') 
                ? '/ArtistHub-BaguioCity'
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
                window.location.href = `${baseUrl}/${cleanPath}`;
            } else {
                window.location.href = `${baseUrl}/${cleanPath}`;
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };
}

// Voiceflow chat initialization
(function(d, t) {
    var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = function() {
        window.voiceflow.chat.load({
            verify: { 
                projectID: '6706887ba2382c6fe907495e',
                apiKey: VOICEFLOW_API_KEY
            },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: {
                url: "https://runtime-api.voiceflow.com"
            },
            theme: {
                button: {
                    size: 56,
                    radius: 28,
                    backgroundColor: '#4CAF50',
                    iconColor: '#FFFFFF'
                },
                chat: {
                    backgroundColor: '#F4F8FF',
                    width: 400,
                    height: 600,
                    borderRadius: 16,
                    poweredBy: false,
                },
                messages: {
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 16,
                    textColor: '#000000',
                    userBackgroundColor: '#4CAF50',
                    userTextColor: '#FFFFFF',
                    assistantBackgroundColor: '#FFFFFF',
                    assistantTextColor: '#000000'
                }
            }
        });
    }
    v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    v.type = "text/javascript";
    s.parentNode.insertBefore(v, s);
})(document, 'script');

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
            ? '/ArtistHub-BaguioCity'
            : '';
            
        const profileUrl = `${baseUrl}/profile/profile.html?id=${auth.currentUser.uid}`;
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