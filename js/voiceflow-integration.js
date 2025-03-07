/**
 * Voiceflow Chat Widget Integration Script
 * This module handles the integration of the Voiceflow chat widget into the Artist Hub website.
 * It configures the widget appearance and functionality.
 */

// Import API key from config
import { VOICEFLOW_API_KEY } from './config.js';

/**
 * Initialize the Voiceflow chat widget with custom settings
 */
export function initVoiceflowWidget() {
    try {
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
                    // Styling configuration
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
        
        console.log('Voiceflow widget initialized successfully');
    } catch (error) {
        console.error('Error initializing Voiceflow widget:', error);
    }
}

// Initialize widget when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    initVoiceflowWidget();
});

// Export functions for external use
export default {
    initVoiceflowWidget
};
