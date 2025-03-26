import { db } from '../js/firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Load pending artist registrations
export async function loadPendingArtists() {
    try {
        const usersRef = collection(db, "users");
        
        // Simple query without orderBy to avoid index requirement
        const q = query(
            usersRef, 
            where("userType", "==", "artist"), 
            where("status", "==", "pending")
        );
        
        const querySnapshot = await getDocs(q);
        
        const pendingArtistsTable = document.getElementById('pendingArtists');
        pendingArtistsTable.innerHTML = '';
        
        if (querySnapshot.empty) {
            pendingArtistsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-400">No pending artist registrations found.</td>
                </tr>
            `;
            return;
        }
        
        // Sort in memory instead of using orderBy in the query
        const artists = [];
        querySnapshot.forEach((doc) => {
            artists.push({
                id: doc.id,
                data: doc.data()
            });
        });
        
        // Sort by createdAt if available
        artists.sort((a, b) => {
            const timeA = a.data.createdAt?.toDate?.() || 0;
            const timeB = b.data.createdAt?.toDate?.() || 0;
            return timeB - timeA; // descending order (newest first)
        });
        
        // Generate the HTML from the sorted array
        artists.forEach(({ id: artistId, data: artist }) => {
            const createdAt = artist.createdAt?.toDate ? new Date(artist.createdAt.toDate()).toLocaleDateString() : 'Unknown';
            
            pendingArtistsTable.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${artist.name || artist.displayName || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.email || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.phone || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.address || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${createdAt}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <button onclick="approveArtist('${artistId}')" class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-1">
                            Approve
                        </button>
                        <button onclick="rejectArtist('${artistId}')" class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                            Reject
                        </button>
                    </td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error("Error loading pending artists:", error);
        
        // Specific error handling for the index error
        if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
            const pendingArtistsTable = document.getElementById('pendingArtists');
            pendingArtistsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center">
                        <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
                            <p class="font-bold">Database Index Required</p>
                            <p>This query requires a Firestore index. Please ask the administrator to create the required index.</p>
                            <p class="mt-2">Error details: ${error.message}</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            const pendingArtistsTable = document.getElementById('pendingArtists');
            pendingArtistsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-400">Error loading pending artists. Please try again.</td>
                </tr>
            `;
        }
    }
}

// Approve artist
export async function approveArtist(artistId) {
    try {
        const artistRef = doc(db, "users", artistId);
        await updateDoc(artistRef, {
            status: "approved",
            approvedAt: serverTimestamp()
        });
        
        alert("Artist approved successfully");
        loadPendingArtists(); // Reload the list
        
    } catch (error) {
        console.error("Error approving artist:", error);
        alert("Failed to approve artist: " + error.message);
    }
}

// Reject artist - now completely removes the user from the database
export async function rejectArtist(artistId) {
    try {
        if (confirm("Are you sure you want to reject and delete this artist? This action cannot be undone.")) {
            // Delete the artist document from the users collection
            const artistRef = doc(db, "users", artistId);
            await deleteDoc(artistRef);
            
            // Note: To also delete the Firebase Auth account, you would need Firebase Admin SDK
            // which requires server-side implementation
            
            alert("Artist rejected and removed from the system");
            loadPendingArtists(); // Reload the list
        }
    } catch (error) {
        console.error("Error rejecting artist:", error);
        alert("Failed to reject artist: " + error.message);
    }
}

// Make functions available globally
window.approveArtist = approveArtist;
window.rejectArtist = rejectArtist;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadPendingArtists();
});