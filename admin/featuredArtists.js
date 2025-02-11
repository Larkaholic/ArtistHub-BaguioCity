import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

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
            <img src="${artist.profileImageUrl}" alt="${artist.name}" class="w-16 h-16 rounded-full">
            <div>
                <h3 class="text-lg font-semibold">${artist.name}</h3>
                <p class="text-gray-400">${artist.bio}</p>
            </div>
        `;

        featuredArtistsList.appendChild(artistElement);
    });
}

window.pickFeaturedArtists = pickFeaturedArtists;
