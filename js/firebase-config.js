import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyAyIfQ9879WmJ50X0-RODrLR7E_XMIZuDo",
authDomain: "artisthub-baguiocity-9213d.firebaseapp.com",
  databaseURL: "https://artisthub-baguiocity-9213d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "artisthub-baguiocity-9213d",
  storageBucket: "artisthub-baguiocity-9213d.firebasestorage.app",
  messagingSenderId: "1022255178342",
  appId: "1:1022255178342:web:e5024e567b3e4a21f783a7",
  measurementId: "G-0ZEN20HVL5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// feature detection and fallback
const checkFirebaseConnection = async () => {
    try {
        // Test Firestore connection
        await db.collection('test').get();
        return true;
    } catch (error) {
        console.warn('Firebase features might be blocked:', error.message);
        
        // Show user-friendly message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            text-align: center;
            max-width: 80%;
        `;
        message.innerHTML = `
            <p>Some features are currently blocked. To use all features:</p>
            <ul style="list-style: none; margin-top: 10px;">
                <li>• Disable your ad blocker for this site</li>
                <li>• Allow third-party cookies</li>
                <li>• Disable privacy blockers</li>
            </ul>
        `;
        document.body.appendChild(message);
        
        // Remove message after 8 seconds
        setTimeout(() => message.remove(), 8000);
        return false;
    }
};

export { app, auth, db, provider, checkFirebaseConnection };