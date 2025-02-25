import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

document.addEventListener('DOMContentLoaded', loadArtworks);

async function loadArtworks() {
    const galleryContainer = document.getElementById('galleryContainer');
    
    try {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">Loading artworks...</p>';

        const querySnapshot = await getDocs(collection(db, 'gallery_images'));
        
        if (querySnapshot.empty) {
            galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found.</p>';
            return;
        }

        galleryContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = createArtworkCard(doc.id, data);
            galleryContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading artworks:', error);
        galleryContainer.innerHTML = '<p class="text-center col-span-full text-red-500">Error loading artworks.</p>';
    }
}

function createArtworkCard(id, data) {
    const card = document.createElement('div');
    card.className = 'artwork-card';
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}" class="artwork-image">
        <div class="p-6">
            <div class="flex flex-col gap-2">
                <h3 class="artwork-title">${data.title}</h3>
                <div class="flex justify-between items-center">
                    <p class="artwork-price">₱${parseFloat(data.price || 0).toFixed(2)}</p>
                </div>
            </div>
            <p class="artwork-description">${data.description || 'No description available.'}</p>
            ${auth.currentUser ? 
                `<button onclick="window.addToCart('${id}', '${data.title}', ${parseFloat(data.price)})" 
                    class="artwork-button">
                    Add this to Cart
                </button>` :
                `<button onclick="window.toggleLoginFlyout()" 
                    class="artwork-button">
                    Login to Add to Cart
                </button>`
            }
        </div>
    `;
    return card;
}
