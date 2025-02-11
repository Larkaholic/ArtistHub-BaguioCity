import { getFirestore, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "../js/firebase-config.js";

const db = getFirestore(app);

async function pickFeaturedArtists() {
    const artistsRef = collection(db, "artists");
    const q = query(artistsRef, limit(6));
    const querySnapshot = await getDocs(q);

    const featuredArtistsList = document.getElementById("featuredArtistsList");
    featuredArtistsList.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const artist = doc.data();
        const artistElement = document.createElement("div");
        artistElement.classList.add("bg-gray-800", "p-4", "rounded-lg", "flex", "items-center", "space-x-4");

        artistElement.innerHTML = `
            <img src="${artist.profileImageUrl || 'https://via.placeholder.com/150'}" alt="${artist.name}" class="w-12 h-12 rounded-full">
            <div>
                <h3 class="text-md font-semibold">${artist.name}</h3>
                <p class="text-gray-400 text-sm">${artist.bio}</p>
            </div>
        `;

        featuredArtistsList.appendChild(artistElement);
    });
}

async function searchArtistsInDatabase() {
    const searchInput = document.getElementById("artistSearchInput").value.toLowerCase();
    const artistsRef = collection(db, "users");
    const q = query(artistsRef, where("displayName", "==", searchInput));
    const querySnapshot = await getDocs(q);

    const resultsContainer = document.getElementById("featuredArtistsList");
    resultsContainer.innerHTML = "";
    resultsContainer.classList.add("grid", "grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3", "gap-4");

    const artists = [];
    querySnapshot.forEach((doc) => {
        artists.push({ id: doc.id, ...doc.data() });
    });

    artists.forEach(artist => {
        if (artist.displayName && artist.displayName.toLowerCase().includes(searchInput)) {
            console.log('Matching Artist:', artist); // Debug log
            const artistCard = document.createElement('div');
            artistCard.className = `
                glass-header rounded-lg p-4 flex flex-col items-center border-2 border-gray-700
                min-w-[150px] transform transition-transform duration-200 hover:-translate-y-1
            `;
            
            const specialization = artist.artistDetails?.specialization ?? 'artist';
            
            artistCard.innerHTML = `
                <img src="${artist.photoURL || 'https://via.placeholder.com/150'}" alt="${artist.displayName}" 
                    class="w-24 h-24 rounded-full object-cover mb-2 border-4 border-black text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <h3 class="text-xl font-bold mb-1 text-white">${artist.displayName}</h3>
                <p class="text-center mb-2 text-white text-sm">${specialization}</p>
                <button class="bg-white text-black py-1 px-4 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                    View Profile
                </button>
            `;

            artistCard.querySelector('button').onclick = () => {
                window.location.href = `./profile/profile.html?id=${artist.id}`;
            };

            resultsContainer.appendChild(artistCard);
        }
    });
}

window.pickFeaturedArtists = pickFeaturedArtists;
window.searchArtistsInDatabase = searchArtistsInDatabase;