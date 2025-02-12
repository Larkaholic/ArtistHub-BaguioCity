import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

async function displayFeaturedArtists() {
    try {
        console.log("Fetching featured artists...");
        const featuredArtistsRef = doc(db, "featured", "artists");
        const docSnap = await getDoc(featuredArtistsRef);

        if (docSnap.exists()) {
            const featuredArtists = docSnap.data().artists;
            const featuredArtistsGrid = document.getElementById("featuredArtistsGrid");
            featuredArtistsGrid.innerHTML = "";

            for (const artist of featuredArtists.slice(0, 6)) {
                if (!artist.id) {
                    console.error("Artist ID is missing:", artist);
                    continue;
                }

                const artistDetailsRef = doc(db, "users", artist.id);
                const artistDetailsSnap = await getDoc(artistDetailsRef);
                const specialization = artistDetailsSnap.exists() ? artistDetailsSnap.data().artistDetails?.specialization : 'artist';

                const card = document.createElement('div');
                card.className = `
                    rounded-lg p-6 flex flex-col items-center border-gray-700
                    min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1 border-2 border-black
                `;
                
                card.innerHTML = `
                    <img src="${artist.image}" alt="${artist.name}" 
                        class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <h3 class="text-3xl font-bold mb-2 text-black">${artist.name}</h3>
                    <p class="text-center mb-4 text-black text-lg">${specialization}</p>
                    <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                        View Profile
                    </button>
                `;

                card.querySelector('button').onclick = () => {
                    window.location.href = `./profile/profile.html?id=${artist.id}`;
                };

                featuredArtistsGrid.appendChild(card);
            }
        } else {
            console.log("No featured artists found.");
        }
    } catch (error) {
        console.error("Error fetching featured artists:", error);
    }
}

window.onload = displayFeaturedArtists;
