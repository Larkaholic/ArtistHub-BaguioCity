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
    serverTimestamp,
    getDoc
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
                    <td colspan="7" class="px-6 py-4 text-center text-gray-400">No pending artist registrations found.</td>
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
            
            // Create ID preview column content
            let idPreviewContent = 'No ID uploaded';
            if (artist.idVerification && artist.idVerification.idUrl) {
                idPreviewContent = `
                    <a href="${artist.idVerification.idUrl}" target="_blank" class="text-blue-400 hover:underline flex items-center">
                        <img src="${artist.idVerification.idUrl}" alt="ID Preview" class="w-12 h-8 object-cover rounded mr-2">
                        View ID
                    </a>
                `;
            }
            
            pendingArtistsTable.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${artist.name || artist.displayName || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.email || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.phone || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${artist.address || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${idPreviewContent}</td>
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
                    <td colspan="7" class="px-6 py-4 text-center">
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
                    <td colspan="7" class="px-6 py-4 text-center text-red-400">Error loading pending artists. Please try again.</td>
                </tr>
            `;
        }
    }
}

// Function to extract public ID from Cloudinary URL
function extractCloudinaryPublicId(url) {
    try {
        if (!url || typeof url !== 'string') return null;
        
        // Example URL format: https://res.cloudinary.com/dxeyr4pvf/image/upload/v1684512345/user_ids/abcd1234
        const regex = /\/v\d+\/([^/]+\/[^/.]+)/;
        const match = url.match(regex);
        
        if (match && match[1]) {
            return match[1]; // Returns e.g., "user_ids/abcd1234"
        }
        
        // Alternative format without version
        const altRegex = /\/upload\/([^/]+\/[^/.]+)/;
        const altMatch = url.match(altRegex);
        
        if (altMatch && altMatch[1]) {
            return altMatch[1];
        }
        
        return null;
    } catch (error) {
        console.error("Error extracting Cloudinary public ID:", error);
        return null;
    }
}

// Function to delete an image from Cloudinary
async function deleteFromCloudinary(imageUrl) {
    try {
        console.log('Attempting to delete Cloudinary image:', imageUrl);
        
        const publicId = extractCloudinaryPublicId(imageUrl);
        if (!publicId) {
            console.warn('Could not extract public ID from URL:', imageUrl);
            return false;
        }
        
        console.log('Extracted public ID:', publicId);
        
        // Note: Client-side deletion from Cloudinary requires authentication, which isn't secure to include in client-side code
        // This implementation is a placeholder that will always return false, indicating manual deletion is required
        // In a production environment, you would implement this server-side
        
        // Show an alert to the admin
        const manualDeleteConfirm = confirm(
            'Due to security restrictions, Cloudinary images cannot be deleted directly from the browser.\n\n' +
            'Would you like to delete the ID image manually through your Cloudinary dashboard?\n\n' +
            'Image ID: ' + publicId
        );
        
        // If admin confirms, open Cloudinary dashboard in a new tab
        if (manualDeleteConfirm) {
            window.open('https://cloudinary.com/console/media_library/folders/user_ids', '_blank');
        }
        
        // Return false to indicate automatic deletion failed
        return false;
    } catch (error) {
        console.error('Error in deleteFromCloudinary:', error);
        return false;
    }
}

// Approve artist
export async function approveArtist(artistId) {
    try {
        const artistRef = doc(db, "users", artistId);
        const artistDoc = await getDoc(artistRef);
        
        if (!artistDoc.exists()) {
            alert("Artist not found");
            return;
        }
        
        const artistData = artistDoc.data();
        let idUrl = null;
        
        // Store the ID URL before we update anything
        if (artistData.idVerification && artistData.idVerification.idUrl) {
            idUrl = artistData.idVerification.idUrl;
        }
        
        const updateData = {
            status: "approved",
            approvedAt: serverTimestamp()
        };
        
        // If there's ID verification data, approve it too
        if (artistData.idVerification) {
            updateData["idVerification.status"] = "approved";
            updateData["idVerification.verifiedAt"] = serverTimestamp();
        }
        
        await updateDoc(artistRef, updateData);
        
        // After successful database update, delete the ID image from Cloudinary
        let idDeletionMessage = "";
        if (idUrl) {
            console.log('Attempting to delete ID image from Cloudinary:', idUrl);
            const deleted = await deleteFromCloudinary(idUrl);
            if (deleted) {
                console.log('ID image successfully deleted from Cloudinary');
                
                // Update the database to set idUrl to null or include a flag that it was deleted
                await updateDoc(artistRef, {
                    "idVerification.idUrl": null,
                    "idVerification.idDeleted": true,
                    "idVerification.deletedAt": serverTimestamp()
                });
            } else {
                idDeletionMessage = "\nNote: The ID image could not be deleted from Cloudinary at this time.";
                console.warn('Failed to delete ID image from Cloudinary. The ID URL will remain in the database.');
                
                // Add a note in the database that deletion was attempted but failed
                await updateDoc(artistRef, {
                    "idVerification.deletionAttempted": true,
                    "idVerification.deletionAttemptedAt": serverTimestamp()
                });
            }
        }
        
        alert("Artist approved successfully!" + idDeletionMessage);
        loadPendingArtists(); // Reload the list
        
    } catch (error) {
        console.error("Error approving artist:", error);
        alert("Failed to approve artist: " + error.message);
    }
}

// Reject artist - simply removes the user from the database
export async function rejectArtist(artistId) {
    try {
        if (confirm("Are you sure you want to reject and delete this artist? This action cannot be undone.")) {
            // Delete the artist document from the users collection
            const artistRef = doc(db, "users", artistId);
            await deleteDoc(artistRef);
            
            // Note: The ID image will remain in Cloudinary
            // Due to security restrictions, we cannot delete Cloudinary images directly from the browser
            
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