import { db } from '../js/firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Function to load pending artist registrations
async function loadPendingArtistRequests() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const pendingList = document.getElementById('pendingArtists');

        if (pendingList) {
            if (querySnapshot.empty) {
                pendingList.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-gray-500">
                            No pending registrations found
                        </td>
                    </tr>`;
                return;
            }

            let pendingHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const registeredAt = data.registeredAt ? new Date(data.registeredAt.seconds * 1000) : new Date();
                pendingHTML += `
                    <tr class="hover:bg-gray-700">
                        <td class="px-6 py-4">${data.name || 'N/A'}</td>
                        <td class="px-6 py-4">${data.email || 'N/A'}</td>
                        <td class="px-6 py-4">${data.phone || 'N/A'}</td>
                        <td class="px-6 py-4">${data.address || 'N/A'}</td>
                        <td class="px-6 py-4">${registeredAt.toLocaleDateString()}</td>
                        <td class="px-6 py-4">
                            <button onclick="approveArtist('${doc.id}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2">
                                Approve
                            </button>
                            <button onclick="rejectArtist('${doc.id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                                Reject
                            </button>
                        </td>
                    </tr>`;
            });
            pendingList.innerHTML = pendingHTML; // Update the HTML with the pending registrations
        }
    } catch (error) {
        console.error("Error loading pending artist registrations:", error);
    }
}

// Approve artist function
async function approveArtist(userId) {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { status: 'approved' });
        alert('Artist approved successfully');
        loadPendingArtistRequests(); // Refresh the list
    } catch (error) {
        console.error("Error approving artist:", error);
        alert('Failed to approve artist');
    }
}

// Make the function globally available
window.approveArtist = approveArtist;

// Reject artist function
async function rejectArtist(userId) {
    if (confirm('Are you sure you want to reject this registration?')) {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { status: 'rejected' });
            alert('Artist registration rejected');
            loadPendingArtistRequests(); // Refresh the list
        } catch (error) {
            console.error("Error rejecting artist:", error);
            alert('Failed to reject artist');
        }
    }
}

// Call the function to load pending artist requests when the page loads
document.addEventListener('DOMContentLoaded', loadPendingArtistRequests); 