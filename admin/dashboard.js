import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    doc,
    getDoc,
    query,
    orderBy,
    updateDoc,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Admin check function
async function checkAdminStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '../index.html';
            return false;
        }
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
        
        if (!isAdmin) {
            console.log('User is not admin:', user.email);
        }
        
        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Debug function to check user status
async function debugUserStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            return;
        }

        console.log('Current user:', user.email);
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            console.log('User data:', userDoc.data());
            console.log('Is admin?', userDoc.data().isAdmin);
        } else {
            console.log('No user document found');
        }
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        const user = auth.currentUser;
        
        // If no user is logged in, wait for auth state to change
        if (!user) {
            console.log('Waiting for auth state...');
            return;
        }

        console.log('Checking admin status for:', user.email);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
        
        console.log('Admin status:', isAdmin);

        if (!isAdmin) {
            console.log('Access denied: User is not admin');
            document.body.innerHTML = `
                <div class="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
                    <div class="max-w-md mx-auto bg-red-500/10 border border-red-500 rounded-lg p-8 text-center">
                        <h1 class="text-2xl font-bold mb-4">Access Denied</h1>
                        <p class="mb-4">You do not have admin privileges.</p>
                        <a href="../index.html" 
                           class="inline-block px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                            Return to Home
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // User is admin, show dashboard
        console.log('Access granted: Loading dashboard');
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.classList.remove('hidden');
            await loadPendingRequests();
            await loadEvents();
        } else {
            console.error('Dashboard content element not found');
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        initializeDashboard();
    } else {
        window.location.href = '../index.html';
    }
});

// Also try to initialize immediately
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        initializeDashboard();
    }
});

// protect admin route
function checkAdminAccess() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData?.isAdmin) {
            window.location.href = '../index.html';
            return;
        }

        // if we get here, user is admin, load the dashboard
        loadEvents();
    });
}

// load existing events
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    try {
        const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
        const querySnapshot = await getDocs(eventsQuery);

        if (querySnapshot.empty) {
            eventsList.innerHTML = `
                <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                    no events yet
                </div>
            `;
            return;
        }

        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const eventEl = document.createElement('div');
            eventEl.className = 'glass-header rounded-lg p-4 space-y-2';
            eventEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-white">${event.title}</h3>
                    ${event.isFeatured ? 
                        '<span class="bg-yellow-500 text-black px-2 py-1 rounded-md text-sm">featured</span>' 
                        : ''}
                </div>
                <p class="text-gray-200">date: ${formattedDate}</p>
                <p class="text-gray-200">location: ${event.location}</p>
                <p class="text-gray-200">${event.description}</p>
                <button onclick="deleteEvent('${doc.id}')" 
                    class="mt-4 bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition duration-300">
                    delete
                </button>
            `;
            eventsList.appendChild(eventEl);
        });
    } catch (error) {
        eventsList.innerHTML = `
            <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                error loading events
            </div>
        `;
    }
}

// delete event
window.deleteEvent = async (eventId) => {
    if (confirm('are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert('event deleted successfully');
            loadEvents();
        } catch (error) {
            alert('error deleting event: ' + error.message);
        }
    }
};

// add this function to load pending users
async function loadPendingUsers() {
    const pendingUsersContainer = document.getElementById('pendingUsersContainer');
    if (!pendingUsersContainer) return;

    try {
        const q = query(collection(db, "users"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            pendingUsersContainer.innerHTML = '<p class="text-center col-span-full">no pending requests</p>';
            return;
        }

        pendingUsersContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const userCard = document.createElement('div');
            userCard.className = 'glass-header p-4 rounded-lg';
            userCard.innerHTML = `
                <div class="flex items-start space-x-4">
                    <img src="${userData.photoURL || 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true'}" 
                         alt="Profile" 
                         class="w-20 h-20 rounded-full object-cover">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg">${userData.displayName || 'unnamed artist'}</h3>
                        <p class="text-sm">${userData.email}</p>
                        <p class="text-sm">type: ${userData.userType}</p>
                        ${userData.artistDetails ? `
                            <p class="text-sm">specialization: ${userData.artistDetails.specialization || 'not specified'}</p>
                            <p class="text-sm">bio: ${userData.artistDetails.bio || 'no bio'}</p>
                        ` : ''}
                    </div>
                </div>
                <div class="flex justify-end space-x-2 mt-4">
                    <button onclick="approveUser('${doc.id}')" 
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        approve
                    </button>
                    <button onclick="rejectUser('${doc.id}')" 
                            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        reject
                    </button>
                </div>
            `;
            pendingUsersContainer.appendChild(userCard);
        });
    } catch (error) {
        console.error("error loading pending users:", error);
        pendingUsersContainer.innerHTML = '<p class="text-center col-span-full text-red-500">error loading pending requests</p>';
    }
}

// add approval/rejection functions
window.approveUser = async function(userId) {
    try {
        await updateDoc(doc(db, "users", userId), {
            status: 'approved',
            updatedAt: new Date().toISOString()
        });
        alert('user approved successfully');
        loadPendingUsers(); // refresh the list
    } catch (error) {
        console.error("error approving user:", error);
        alert('error approving user');
    }
}

window.rejectUser = async function(userId) {
    if (!confirm('are you sure you want to reject this user?')) return;
    
    try {
        await updateDoc(doc(db, "users", userId), {
            status: 'rejected',
            updatedAt: new Date().toISOString()
        });
        alert('user rejected');
        loadPendingUsers(); // refresh the list
    } catch (error) {
        console.error("error rejecting user:", error);
        alert('error rejecting user');
    }
}

// Add this function to load pending requests
async function loadPendingRequests() {
    const container = document.getElementById('pendingRequests');
    if (!container) return;

    try {
        const q = query(
            collection(db, "users"),
            where("userType", "==", "artist"),
            where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-white text-center">No pending requests</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            container.innerHTML += `
                <div class="glass-header p-6 rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-semibold text-white">${data.email}</h3>
                            <p class="text-gray-300">Registered: ${new Date(data.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div class="flex gap-4">
                            <button onclick="approveRequest('${doc.id}')"
                                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Approve
                            </button>
                            <button onclick="rejectRequest('${doc.id}')"
                                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading pending requests:", error);
        container.innerHTML = '<p class="text-red-500 text-center">Error loading pending requests</p>';
    }
}

// Add approval/rejection handlers
window.approveRequest = async function(userId) {
    try {
        // Check admin status first
        if (!(await checkAdminStatus())) {
            alert('You do not have admin privileges');
            return;
        }

        await updateDoc(doc(db, "users", userId), {
            status: 'approved',
            approvedAt: serverTimestamp()
        });
        alert('Artist approved successfully');
        loadPendingRequests();
    } catch (error) {
        console.error("Error approving request:", error);
        alert('Error approving request: ' + error.message);
    }
}

window.rejectRequest = async function(userId) {
    try {
        // Check admin status first
        if (!(await checkAdminStatus())) {
            alert('You do not have admin privileges');
            return;
        }

        if (!confirm('Are you sure you want to reject this artist?')) return;
        
        await updateDoc(doc(db, "users", userId), {
            status: 'rejected',
            rejectedAt: serverTimestamp()
        });
        alert('Artist rejected successfully');
        loadPendingRequests();
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert('Error rejecting request: ' + error.message);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard); 