import { getFirestore, collection, getDocs, query, where, limit, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
        artistElement.classList.add("bg-gray-800", "p-4", "rounded-lg", "flex", "items-center", "space-x-4", "relative");

        artistElement.innerHTML = `
            <input type="checkbox" class="absolute top-2 right-2 w-6 h-6">
            <img src="${artist.profileImageUrl || 'https://via.placeholder.com/150'}" alt="${artist.name}" class="w-12 h-12 rounded-full">
            <div>
                <h3 class="text-md font-semibold">${artist.name}</h3>
                <p class="text-gray-400 text-sm">${artist.bio}</p>
            </div>
        `;

        artistElement.dataset.artistId = doc.id;
        featuredArtistsList.appendChild(artistElement);
    });
}

async function searchArtistsInDatabase() {
    const searchInput = document.getElementById("artistSearchInput").value.toLowerCase();
    const artistsRef = collection(db, "users");
    const querySnapshot = await getDocs(artistsRef);

    const resultsContainer = document.getElementById("featuredArtistsList");
    resultsContainer.innerHTML = "";
    resultsContainer.classList.add("grid", "grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3", "gap-4");

    const artists = [];
    querySnapshot.forEach((doc) => {
        const artist = doc.data();
        if (artist.displayName && artist.displayName.toLowerCase().includes(searchInput)) {
            artists.push({ id: doc.id, ...artist });
        }
    });

    for (const artist of artists) {
        const artistDetailsRef = doc(db, "users", artist.id);
        const artistDetailsSnap = await getDoc(artistDetailsRef);
        const specialization = artistDetailsSnap.exists() ? artistDetailsSnap.data().artistDetails?.specialization : 'artist';

        const artistCard = document.createElement('div');
        artistCard.className = `
            glass-header rounded-lg p-4 flex flex-col items-center border-2 border-gray-700
            min-w-[150px] transform transition-transform duration-200 hover:-translate-y-1 relative
        `;
        
        artistCard.innerHTML = `
            <input type="checkbox" class="absolute top-2 right-2 w-6 h-6">
            <img src="${artist.photoURL || 'https://via.placeholder.com/150'}" alt="${artist.displayName}" 
                class="w-24 h-24 rounded-full object-cover mb-2 border-4 border-black text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <h3 class="text-xl font-bold mb-1 text-white">${artist.displayName}</h3>
            <p class="text-center mb-2 text-white text-sm">${specialization}</p>
            <button class="bg-white text-black py-1 px-4 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                View Profile
            </button>
        `;

        artistCard.dataset.artistId = artist.id;
        artistCard.querySelector('button').onclick = () => {
            // Update to match the pattern from search.js
            window.location.href = `../profile/profile.html?id=${artist.id}`;
        };

        resultsContainer.appendChild(artistCard);
    }
}

async function featureSelectedArtists() {
    const checkboxes = document.querySelectorAll("#featuredArtistsList input[type='checkbox']:checked");
    const selectedArtists = [];

    for (const checkbox of checkboxes) {
        const artistCard = checkbox.closest('div');
        const artistId = artistCard.dataset.artistId;
        const artistName = artistCard.querySelector('h3').innerText;
        const artistBio = artistCard.querySelector('p').innerText;
        const artistImage = artistCard.querySelector('img').src;

        selectedArtists.push({ id: artistId, name: artistName, bio: artistBio, image: artistImage });
    }

    const featuredArtistsRef = doc(db, "featured", "artists");
    const docSnap = await getDoc(featuredArtistsRef);

    let existingFeaturedArtists = [];
    if (docSnap.exists()) {
        existingFeaturedArtists = docSnap.data().artists;
    }

    const updatedFeaturedArtists = [...existingFeaturedArtists, ...selectedArtists].slice(0, 6);

    if (docSnap.exists()) {
        await updateDoc(featuredArtistsRef, { artists: updatedFeaturedArtists });
    } else {
        await setDoc(featuredArtistsRef, { artists: updatedFeaturedArtists });
    }

    alert("Selected artists have been featured!");
    displayCurrentlyFeaturedArtists();
}

async function removeFeaturedArtist(artistId) {
    const featuredArtistsRef = doc(db, "featured", "artists");
    const docSnap = await getDoc(featuredArtistsRef);

    if (docSnap.exists()) {
        const existingFeaturedArtists = docSnap.data().artists;
        const updatedFeaturedArtists = existingFeaturedArtists.filter(artist => artist.id !== artistId);

        await updateDoc(featuredArtistsRef, { artists: updatedFeaturedArtists });
        alert("Artist has been removed from featured list!");
        displayCurrentlyFeaturedArtists();
    } else {
        console.log("No featured artists found.");
    }
}

async function displayCurrentlyFeaturedArtists() {
    const currentlyFeaturedContainer = document.getElementById("currentlyFeaturedArtists");
    if (!currentlyFeaturedContainer) {
        console.error("Currently featured artists container not found.");
        return;
    }

    const featuredArtistsRef = doc(db, "featured", "artists");
    const docSnap = await getDoc(featuredArtistsRef);

    currentlyFeaturedContainer.innerHTML = "";

    if (docSnap.exists()) {
        const featuredArtists = docSnap.data().artists;

        for (const artist of featuredArtists) {
            const artistItem = document.createElement('div');
            artistItem.className = "flex items-center space-x-4 p-2 bg-gray-800 rounded-lg";

            artistItem.innerHTML = `
                <img src="${artist.image}" alt="${artist.name}" class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1">
                    <h3 class="text-md font-semibold text-white">${artist.name}</h3>
                    <p class="text-sm text-gray-400">${artist.bio}</p>
                </div>
                <button class="bg-red-500 text-white py-1 px-4 rounded-md hover:bg-red-600 transition duration-300 font-semibold border-2 border-black">
                    Remove
                </button>
            `;

            artistItem.querySelector('button').onclick = () => {
                removeFeaturedArtist(artist.id);
            };

            currentlyFeaturedContainer.appendChild(artistItem);
        }
    } else {
        currentlyFeaturedContainer.innerHTML = '<p class="text-white text-center">No featured artists found.</p>';
    }
}

async function loadFeaturedArtists() {
    try {
        const featuredArtistsList = document.getElementById('featuredArtistsList');
        if (!featuredArtistsList) return;

        featuredArtistsList.innerHTML = '<div class="text-center p-4"><div class="spinner mx-auto"></div><p class="mt-2 text-gray-400">Loading featured artists...</p></div>';

        const profilesCollection = collection(db, "artist_profiles");
        const q = query(profilesCollection, where("isFeatured", "==", true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            featuredArtistsList.innerHTML = '<p class="text-center text-gray-400 p-4">No featured artists found</p>';
            return;
        }

        featuredArtistsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const artist = doc.data();
            const artistElement = document.createElement('div');
            artistElement.className = 'bg-gray-800 p-4 rounded-lg mb-4';
            artistElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <img src="${artist.profileImageUrl || 'https://via.placeholder.com/150'}" alt="${artist.name}" class="w-12 h-12 rounded-full">
                        <div>
                            <h3 class="text-md font-semibold text-white">${artist.name}</h3>
                            <p class="text-sm text-gray-400">${artist.bio || 'No bio available'}</p>
                        </div>
                    </div>
                    <button onclick="removeFromFeatured('${doc.id}')" class="text-red-500 hover:text-red-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
            featuredArtistsList.appendChild(artistElement);
        });
    } catch (error) {
        console.error("Error loading featured artists:", error);
        if (featuredArtistsList) {
            featuredArtistsList.innerHTML = '<p class="text-center text-red-500 p-4">Error loading featured artists</p>';
        }
    }
}

export { 
    pickFeaturedArtists, 
    searchArtistsInDatabase, 
    featureSelectedArtists, 
    removeFeaturedArtist, 
    displayCurrentlyFeaturedArtists,
    loadFeaturedArtists 
};