import { db } from './firebase-config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadArtists() {
    const artistsGrid = document.getElementById('artistsGrid');
    if (!artistsGrid) {
        console.error('artistsGrid element not found!');
        return;
    }

    try {
        const artistsRef = collection(db, "users");
        const q = query(artistsRef, where("userType", "==", "artist"));
        const querySnapshot = await getDocs(q);
        
        let artistsWithImages = [];

        querySnapshot.forEach((doc) => {
            const artistData = doc.data();
            console.log('Artist data:', artistData);
            if (artistData.photoURL && artistData.photoURL.trim() !== '') {
                artistsWithImages.push({ id: doc.id, ...artistData });
            }
        });

        // Clear the grid
        artistsGrid.innerHTML = '';

        // Debug log
        console.log('Artists to display:', artistsWithImages);

        artistsWithImages.forEach((artist) => {
            // Create the main card container
            const cardDiv = document.createElement('div');
            cardDiv.className = 'glass-header rounded-lg p-6 flex flex-col items-center';
            cardDiv.style.cssText = `
                background: rgba(0, 0, 0, 0.7);
                min-height: 300px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;

            // Create and append image
            const img = document.createElement('img');
            img.src = artist.photoURL;
            img.alt = artist.displayName || 'Artist';
            img.className = 'w-32 h-32 rounded-full object-cover mb-4';
            img.style.cssText = `
                border: 4px solid white;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
            `;
            cardDiv.appendChild(img);

            // Create and append name
            const name = document.createElement('h3');
            name.textContent = artist.displayName || 'Artist';
            name.className = 'text-2xl font-bold mb-2 text-white';
            cardDiv.appendChild(name);

            // Create and append specialization
            const specialization = document.createElement('p');
            specialization.textContent = artist.artistDetails?.specialization || 'Artist';
            specialization.className = 'text-center mb-4 text-gray-200 text-lg';
            cardDiv.appendChild(specialization);

            // Create and append button
            const button = document.createElement('button');
            button.textContent = 'View Profile';
            button.className = 'bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold';
            button.onclick = () => {
                window.location.href = `./profile/profile.html?id=${artist.id}`;
            };
            cardDiv.appendChild(button);

            // Debug logs
            console.log('Created card for:', artist.displayName);
            console.log('Card HTML:', cardDiv.innerHTML);

            // Append the card to the grid
            artistsGrid.appendChild(cardDiv);
        });

    } catch (error) {
        console.error("Error loading artists:", error);
        artistsGrid.innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-lg text-red-500">Error loading artists. Please try again later.</p>
            </div>`;
    }
}

// Load artists when the page loads
document.addEventListener('DOMContentLoaded', loadArtists);

// Also try loading when window is fully loaded
window.addEventListener('load', loadArtists);

// Export the function so it can be called manually if needed
window.loadArtists = loadArtists; 