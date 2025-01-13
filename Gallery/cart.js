// Import Firebase modules
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../js/firebase-config.js";

// Cart Management
let cart = [];
const auth = getAuth();

// Toggle cart visibility
window.toggleCart = function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('hidden');
    }
}

// Show added to cart confirmation modal
function showAddedToCartModal(item) {
    const modalHTML = `
        <div id="addedToCartModal" class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div class="glass-header rounded-lg p-6 max-w-sm mx-auto">
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-2">Item Added to Cart!</h3>
                    <div class="mb-4">
                        <p class="font-medium">${item.title}</p>
                        <p class="text-green-600">₱${item.price.toFixed(2)}</p>
                    </div>
                    <div class="flex justify-center space-x-4">
                        <button onclick="closeAddedToCartModal()" class="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
                            Continue Shopping
                        </button>
                        <button onclick="viewCart()" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                            View Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close added to cart modal
window.closeAddedToCartModal = function() {
    const modal = document.getElementById('addedToCartModal');
    if (modal) modal.remove();
}

// View cart
window.viewCart = function() {
    closeAddedToCartModal();
    toggleCart();
}

// Add to cart
window.addToCart = async function(artworkId, title, price) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to add items to cart');
            return;
        }
        
        const item = { artworkId, title, price };
        cart.push(item);
        
        // Create a document reference with a custom ID (user's UID)
        const cartDocRef = doc(db, 'carts', user.uid);
        
        try {
            // Try to get the existing cart
            const cartDoc = await getDoc(cartDocRef);
            
            if (cartDoc.exists()) {
                // Update existing cart
                const existingItems = cartDoc.data().items || [];
                await updateDoc(cartDocRef, {
                    items: [...existingItems, item],
                    updatedAt: new Date(),
                    userId: user.uid
                });
            } else {
                // Create new cart
                await setDoc(cartDocRef, {
                    items: [item],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: user.uid
                });
            }
            
            updateCartUI();
            showAddedToCartModal(item);
        } catch (error) {
            console.error('Error accessing cart:', error);
            alert('Unable to add item to cart. Please try again later.');
        }
    } catch (error) {
        console.error('Error in addToCart:', error);
        alert('An error occurred while adding the item to cart.');
    }
}

// Remove from cart
window.removeFromCart = async function(index) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to remove items from cart');
            return;
        }

        // Remove from local cart array
        cart.splice(index, 1);
        
        // Get reference to user's cart document
        const cartDocRef = doc(db, 'carts', user.uid);
        
        try {
            const cartDoc = await getDoc(cartDocRef);
            if (cartDoc.exists()) {
                const items = cartDoc.data().items || [];
                items.splice(index, 1);
                
                await updateDoc(cartDocRef, {
                    items: items,
                    updatedAt: new Date()
                });
                
                updateCartUI();
                console.log('Item removed successfully');
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
            alert('Unable to remove item from cart. Please try again later.');
        }
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        alert('An error occurred while removing the item from cart.');
    }
}

// Checkout process
window.checkout = async function() {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to checkout');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Get the cart items with artwork details
        const cartDocRef = doc(db, 'carts', user.uid);
        const cartDoc = await getDoc(cartDocRef);
        
        if (!cartDoc.exists()) {
            alert('Cart not found');
            return;
        }

        const items = cartDoc.data().items;
        
        // Get artwork details for each item
        for (const item of items) {
            const artworkDoc = await getDoc(doc(db, 'artworks', item.artworkId));
            if (artworkDoc.exists()) {
                const artworkData = artworkDoc.data();
                const ownerEmail = artworkData.artistEmail || 'Unknown';
                
                // Create mailto link
                const subject = encodeURIComponent(`Interest in purchasing: ${item.title}`);
                const body = encodeURIComponent(
                    `Hello,\n\n` +
                    `I am interested in purchasing your artwork:\n` +
                    `Title: ${item.title}\n` +
                    `Price: ₱${item.price.toFixed(2)}\n\n` +
                    `Please let me know how we can proceed with the transaction.\n\n` +
                    `Best regards,\n` +
                    `${user.displayName || user.email}`
                );
                
                window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`);
            }
        }
        
        // Clear the cart after checkout
        await updateDoc(cartDocRef, {
            items: [],
            updatedAt: new Date()
        });
        
        cart = [];
        updateCartUI();
        toggleCart();
        alert('Checkout complete! Emails have been prepared to contact the artists.');
        
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred during checkout. Please try again later.');
    }
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('cartCountMobile');
    const cartItems = document.getElementById('cartItems');
    const totalItems = document.getElementById('totalItems');
    const totalPrice = document.getElementById('totalPrice');
    
    if (cartCount) cartCount.textContent = cart.length;
    if (cartCountMobile) cartCountMobile.textContent = cart.length;
    
    if (cartItems) {
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded-lg';
            itemElement.innerHTML = `
                <div>
                    <h3 class="font-semibold">${item.title}</h3>
                    <p class="text-sm">₱${item.price.toFixed(2)}</p>
                </div>
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += item.price;
        });
        
        if (totalItems) totalItems.textContent = cart.length;
        if (totalPrice) totalPrice.textContent = total.toFixed(2);
    }
}

// Load cart data on page load
document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const cartDocRef = doc(db, 'carts', user.uid);
            const cartDoc = await getDoc(cartDocRef);
            if (cartDoc.exists()) {
                cart = cartDoc.data().items || [];
                updateCartUI();
            }
        } catch (error) {
            console.error('Error loading cart data:', error);
        }
    }
});