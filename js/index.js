async function loadArtistProfiles() {
    try {
        const q = query(
            collection(db, "users"),
            where("userType", "==", "artist"),
            where("status", "==", "approved")
        );

        const querySnapshot = await getDocs(q);
        const artistContainer = document.getElementById('artistContainer');
        
        if (querySnapshot.empty) {
            artistContainer.innerHTML = '<p class="text-center">no artists available</p>';
            return;
        }

        artistContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const artistData = doc.data();
            if (artistData.status === 'approved') {
                const artistCard = document.createElement('div');
                artistCard.className = 'artist-card glass-header p-4 rounded-lg';
                artistCard.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <img src="${artistData.photoURL || '../images/default-profile.png'}" 
                             alt="Profile" 
                             class="w-16 h-16 rounded-full object-cover">
                        <div>
                            <h3 class="font-bold">${artistData.displayName || 'unnamed artist'}</h3>
                            <p class="text-sm">${artistData.artistDetails?.specialization || 'artist'}</p>
                        </div>
                    </div>
                    <button onclick="navToEvent('profile/profile.html?id=${doc.id}')" 
                            class="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full">
                        view profile
                    </button>
                `;
                artistContainer.appendChild(artistCard);
            }
        });
    } catch (error) {
        console.error("error loading artist profiles:", error);
        document.getElementById('artistContainer').innerHTML = 
            '<p class="text-center text-red-500">error loading artists</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadArtistProfiles); 