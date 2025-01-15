import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    doc, 
    updateDoc,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Function to initialize the pending artists display
function initializePendingArtists() {
    const usersRef = collection(db, "users");
    // Query for artists with pending status
    const q = query(usersRef, 
        where("userType", "==", "artist"),
        where("status", "==", "pending")
    );

    // Set up real-time listener
    onSnapshot(q, (snapshot) => {
        const pendingList = document.getElementById('pendingArtists');
        
        if (snapshot.empty) {
            pendingList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No pending registrations found
                    </td>
                </tr>`;
            return;
        }

        const pendingHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdDate = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
            
            return `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">${data.name || data.displayName || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${data.email || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${data.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${data.address || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${createdDate.toLocaleDateString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="approveArtist('${doc.id}')" 
                                class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2">
                            Approve
                        </button>
                        <button onclick="rejectArtist('${doc.id}')" 
                                class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Reject
                        </button>
                    </td>
                </tr>`;
        }).join('');

        pendingList.innerHTML = pendingHTML;
    }, (error) => {
        console.error("Error fetching pending artists:", error);
        const pendingList = document.getElementById('pendingArtists');
        pendingList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-red-500">
                    Error loading pending registrations. Please try again later.
                </td>
            </tr>`;
    });
}

// Approve artist function
window.approveArtist = async function(userId) {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            status: 'approved',
            approvedAt: new Date()
        });
        alert('Artist approved successfully');
    } catch (error) {
        console.error("Error approving artist:", error);
        alert('Failed to approve artist');
    }
}

// Reject artist function
window.rejectArtist = async function(userId) {
    if (confirm('Are you sure you want to reject this registration?')) {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                status: 'rejected',
                rejectedAt: new Date()
            });
            alert('Artist registration rejected');
        } catch (error) {
            console.error("Error rejecting artist:", error);
            alert('Failed to reject artist');
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializePendingArtists);