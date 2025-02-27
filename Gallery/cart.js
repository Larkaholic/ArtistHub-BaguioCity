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
    } else {
        console.error('Cart modal not found');
    }
}

// Show added to cart confirmation modal
function showAddedToCartModal(item) {
    const modalHTML = `
        <div id="addedToCartModal" class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div class="glass-header rounded-lg p-6 max-w-sm mx-auto">
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-2 text-black">Item Added to Cart!</h3>
                    <div class="mb-4">
                        <p class="font-medium text-black">${item.title}</p>
                        <p class="text-green-600">₱${Number(item.price).toFixed(2)}</p>
                    </div>
                    <div class="flex justify-center space-x-4">
                        <button onclick="closeAddedToCartModal()" class="text-black bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
                            Continue Shopping
                        </button>
                        <button onclick="viewCart()" class="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-600">
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
        
        // Convert price to number and ensure it has two decimal places
        const numericPrice = Number(price);
        if (isNaN(numericPrice)) {
            throw new Error('Invalid price format');
        }
        
        const item = { 
            artworkId, 
            title, 
            price: numericPrice 
        };
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

// Show email preview modal
function showEmailPreview(artworkData, user, ownerEmail = 'artist@example.com') {
    console.log('Showing email preview for:', artworkData);
    // Convert price to number if it's a string
    const price = typeof artworkData.price === 'string' ? Number(artworkData.price) : artworkData.price;
    
    const emailPreviewHTML = `
        <div id="emailPreviewModal" class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div class="glass-header rounded-lg p-6 max-w-2xl w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-black">Email Preview</h2>
                    <button onclick="window.closeEmailPreview()" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="bg-white bg-opacity-10 rounded-lg p-4 space-y-4">
                    <div class="text-black">
                        <p class="font-semibold">To: ${ownerEmail}</p>
                        <p class="font-semibold">Subject: Interest in purchasing: ${artworkData.title}</p>
                    </div>
                    <div class="border-t border-gray-300 pt-4 text-black">
                        <p>Hello,</p>
                        <br/>
                        <p>I am interested in purchasing your artwork:</p>
                        <p>Title: ${artworkData.title}</p>
                        <p>Price: ₱${price.toFixed(2)}</p>
                        <br/>
                        <p>Please let me know how we can proceed with the transaction.</p>
                        <br/>
                        <p>Best regards,</p>
                        <p>${user.displayName || user.email}</p>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-4">
                    <button onclick="window.closeEmailPreview()" class="text-black bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
                        Edit
                    </button>
                    <button onclick="window.sendEmail('${ownerEmail}', '${artworkData.title}', ${price}, '${user.displayName || user.email}')" 
                            class="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-600">
                        Send Email
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', emailPreviewHTML);
}

window.closeEmailPreview = function() {
    console.log('Closing email preview');
    const modal = document.getElementById('emailPreviewModal');
    if (modal) modal.remove();
}

window.sendEmail = function(ownerEmail, title, price, buyerInfo) {
    console.log('Sending email to:', ownerEmail);
    // Convert price to number if it's a string
    const numericPrice = typeof price === 'string' ? Number(price) : price;
    
    const subject = encodeURIComponent(`Interest in purchasing: ${title}`);
    const body = encodeURIComponent(
        `Hello,\n\n` +
        `I am interested in purchasing your artwork:\n` +
        `Title: ${title}\n` +
        `Price: ₱${numericPrice.toFixed(2)}\n\n` +
        `Please let me know how we can proceed with the transaction.\n\n` +
        `Best regards,\n` +
        `${buyerInfo}`
    );
    
    window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`);
    closeEmailPreview();

    // Clear cart after sending email
    clearCart();
}

// Add new function to clear cart
async function clearCart() {
    try {
        const user = auth.currentUser;
        const cartDocRef = doc(db, 'carts', user.uid);
        
        await updateDoc(cartDocRef, {
            items: [],
            updatedAt: new Date()
        });
        
        cart = [];
        updateCartUI();
        toggleCart();
        alert('Checkout complete! Emails have been prepared to contact the artists.');
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}

// Checkout process
window.checkout = async function() {
    console.log('Checkout started');
    try {
        const user = auth.currentUser;
        console.log('Current user:', user);
        
        if (!user) {
            alert('Please login to checkout');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        console.log('Cart items:', cart);

        const cartDocRef = doc(db, 'carts', user.uid);
        const cartDoc = await getDoc(cartDocRef);
        
        if (!cartDoc.exists()) {
            alert('Cart not found');
            return;
        }

        const items = cartDoc.data().items;
        console.log('Cart items from Firestore:', items);
        
        // Show preview for first item only
        if (items.length > 0) {
            const item = items[0];
            try {
                const artworkDoc = await getDoc(doc(db, 'artworks', item.artworkId));
                let ownerEmail = 'artist@example.com'; // Default email
                
                if (artworkDoc.exists()) {
                    const artworkData = artworkDoc.data();
                    ownerEmail = artworkData.artistEmail || ownerEmail;
                }
                
                showEmailPreview(item, user, ownerEmail);
            } catch (error) {
                console.error('Error fetching artwork:', error);
                // Still show preview even if artwork fetch fails
                showEmailPreview(item, user, 'artist@example.com');
            }
        }
        
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
            itemElement.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded-lg border-2 border-gray-800';
            itemElement.innerHTML = `
                <div>
                    <h3 class="font-semibold">${item.title}</h3>
                    <p class="text-sm">₱${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += parseFloat(item.price);
        });
        
        if (totalItems) totalItems.textContent = cart.length;
        if (totalPrice) totalPrice.textContent = total.toFixed(2);
    }
}

async function loadCartData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

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

// Load cart data on page load
document.addEventListener('DOMContentLoaded', () => {
    // Create cart modal
    const cartModalHTML = `
        <div id="cartModal" class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50 hidden">
            <div class="items-center rounded-lg w-96 mx-10 p-6 bg-white border-2 border-black">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-black">Shopping Cart</h2>
                    <button onclick="window.toggleCart()" class="text-black hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div id="cartItems" class="space-y-4 max-h-96 overflow-y-auto text-black">
                    <!-- Cart items will be dynamically added here -->
                </div>
                <div class="mt-4 flex justify-between items-center text-black">
                    <div>
                        <p>Total Items: <span id="totalItems">0</span></p>
                        <p>Total Price: ₱<span id="totalPrice">0.00</span></p>
                    </div>
                    <button onclick="window.checkout()" class="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-600">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add cart modal to the body
    document.body.insertAdjacentHTML('afterbegin', cartModalHTML);

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadCartData();
        } else {
            cart = [];
            updateCartUI();
        }
    });
});