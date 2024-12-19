// Import Firebase modules
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../js/firebase-config.js";

// Cart Management
let cart = [];
const auth = getAuth();

// Make cart functions globally accessible
window.toggleCart = function() {
    console.log('Toggle cart called');
    const cartModal = document.getElementById('cartModal');
    console.log('Cart modal element:', cartModal);
    if (cartModal) {
        console.log('Current hidden state:', cartModal.classList.contains('hidden'));
        cartModal.classList.toggle('hidden');
        console.log('New hidden state:', cartModal.classList.contains('hidden'));
    } else {
        console.error('Cart modal not found');
    }
}

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
            alert('Item added to cart successfully!');
        } catch (error) {
            console.error('Error accessing cart:', error);
            alert('Unable to add item to cart. Please try again later.');
        }
    } catch (error) {
        console.error('Error in addToCart:', error);
        alert('An error occurred while adding the item to cart.');
    }
}

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

window.checkout = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Here you would implement the checkout process
    alert('Checkout functionality will be implemented soon!');
}

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

// Initialize cart when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create cart modal
    const cartModalHTML = `
        <div id="cartModal" class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50 hidden">
            <div class="glass-header items-center rounded-lg w-96 mx-10 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">Shopping Cart</h2>
                    <button onclick="window.toggleCart()" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div id="cartItems" class="space-y-4 max-h-96 overflow-y-auto">
                    <!-- Cart items will be dynamically added here -->
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <div>
                        <p>Total Items: <span id="totalItems">0</span></p>
                        <p>Total Price: ₱<span id="totalPrice">0.00</span></p>
                    </div>
                    <button onclick="window.checkout()" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add cart modal to the body
    document.body.insertAdjacentHTML('afterbegin', cartModalHTML);
});
