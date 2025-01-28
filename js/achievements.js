import cloudinaryConfig from '../cloudinary-config.js';
import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Initialize elements
const achievementImages = document.getElementById('achievementImages');
const achievementsContainer = document.createElement('div');
achievementsContainer.className = 'grid grid-cols-3 gap-4 mt-4';
let isLoading = false;

// Add container to achievements section
document.querySelector('#achievements').appendChild(achievementsContainer);

// Load achievements on page load
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadUserAchievements();
    }
});

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        loadUserAchievements();
    } else {
        achievementsContainer.innerHTML = '';
    }
});

// File selection and upload handler
achievementImages.addEventListener('change', async function(e) {
    if (!auth.currentUser) {
        alert('Please login first');
        return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    achievementsContainer.innerHTML = '';
    isLoading = true;

    try {
        const uploadPromises = files.map(file => {
            if (!file.type.startsWith('image/')) return null;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryConfig.uploadPreset);

            return fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            }).then(res => res.json());
        }).filter(Boolean);

        const results = await Promise.all(uploadPromises);
        const imageUrls = results.map(result => result.secure_url);

        // Save to Firestore
        const userId = auth.currentUser.uid;
        if (!userId) throw new Error('User not authenticated');

        await addDoc(collection(db, 'achievements'), {
            userId: userId,
            imageUrls: imageUrls,
            createdAt: new Date()
        });

        // Reload achievements
        await loadUserAchievements();

    } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload images: ' + error.message);
    } finally {
        isLoading = false;
    }
});

// Create achievement tile
function createAchievementTile(imageUrl) {
    const tile = document.createElement('div');
    tile.className = 'relative aspect-square rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'w-full h-full object-cover';
    
    tile.appendChild(img);
    return tile;
}

// Display achievements
async function displayAchievements(achievementUrls = []) {
    try {
        console.log('Displaying achievements:', achievementUrls.length);
        achievementsContainer.innerHTML = '';
        achievementUrls.forEach(url => {
            const tile = createAchievementTile(url);
            achievementsContainer.appendChild(tile);
        });
    } catch (error) {
        console.error('Error displaying achievements:', error);
    }
}

// Load user achievements
async function loadUserAchievements() {
    const user = auth.currentUser;
    console.log("Loading achievements for user:", user?.uid);
    
    if (!user) {
        console.log("No user logged in");
        return;
    }

    try {
        // Fixed query with correct field name
        const achievementsRef = collection(db, "achievements");
        const q = query(
            achievementsRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        console.log("Executing query...");
        const querySnapshot = await getDocs(q);
        console.log("Found documents:", querySnapshot.size);

        const allImageUrls = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Achievement document:", doc.id, data);
            if (data.imageUrls && Array.isArray(data.imageUrls)) {
                allImageUrls.push(...data.imageUrls);
            }
        });

        console.log("Total images found:", allImageUrls.length);
        await displayAchievements(allImageUrls);

    } catch (error) {
        console.error("Error in loadUserAchievements:", error);
        if (error.code === 'failed-precondition') {
            console.error("Index missing. Create index in Firebase Console");
        }
    }
}

// Add loading indicator CSS
const style = document.createElement('style');
style.textContent = `
    .loading {
        opacity: 0.5;
        pointer-events: none;
    }
`;
document.head.appendChild(style);