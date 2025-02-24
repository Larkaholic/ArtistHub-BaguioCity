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
    card.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}" class="w-full h-48 object-cover">
        <div class="p-4">
            <h3 class="text-xl font-bold mb-2">${data.title}</h3>
            <p class="text-gray-600 mb-2">${data.description || 'No description available'}</p>
            <p class="text-lg font-semibold text-green-600">₱${parseFloat(data.price).toFixed(2)}</p>
            ${auth.currentUser ? 
                `<button onclick="window.addToCart('${id}', '${data.title}', ${data.price})" 
                    class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
                    Add to Cart
                </button>` :
                `<button onclick="window.toggleLoginFlyout()" 
                    class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
                    Login to Add to Cart
                </button>`
            }
        </div>
    `;
    return card;
}
