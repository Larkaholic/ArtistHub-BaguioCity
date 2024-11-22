import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const isGitHubPages = window.location.hostname.includes('github.io');
const basePath = isGitHubPages ? '/ArtistHub-BaguioCity' : '';

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
const storage = getStorage(app); 

export { app, auth, db, basePath }; 