import { db } from '../js/firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    query, 
    where, 
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// For debugging - can be removed later
const DEBUG = true;

// Load pending ID verifications
export async function loadPendingIdVerifications() {
    try {
        if (DEBUG) console.log("Loading pending ID verifications...");
        
        // Update counter in the dashboard overview
        updateVerificationCounter();
        
        const pendingVerificationsTable = document.getElementById('pendingIdVerifications');
        
        // Check if the element exists before proceeding
        if (!pendingVerificationsTable) {
            if (DEBUG) console.error('Element #pendingIdVerifications not found in DOM');
            return;
        }
        
        // Show loading state
        pendingVerificationsTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center">
                    <div class="flex justify-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    </div>
                    <p class="mt-2 text-gray-400">Loading ID verifications...</p>
                </td>
            </tr>
        `;
        
        const usersRef = collection(db, "users");
        
        // Query for users with pending ID verification
        if (DEBUG) console.log("Executing Firestore query with where clause: idVerification.status == pending");
        const q = query(usersRef, where("idVerification.status", "==", "pending"));
        
        const querySnapshot = await getDocs(q);
        if (DEBUG) console.log(`Query returned ${querySnapshot.size} results`);
        
        if (querySnapshot.empty) {
            pendingVerificationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-400">No pending ID verifications found</td>
                </tr>
            `;
            return;
        }
        
        pendingVerificationsTable.innerHTML = '';
        
        // Sort by submission date (newest first)
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                data: doc.data()
            });
        });
        
        users.sort((a, b) => {
            const timeA = a.data.idVerification?.submittedAt?.toDate?.() || 0;
            const timeB = b.data.idVerification?.submittedAt?.toDate?.() || 0;
            return timeB - timeA;
        });
        
        users.forEach(({ id: userId, data: user }) => {
            const submittedAtTimestamp = user.idVerification?.submittedAt;
            const submittedAt = submittedAtTimestamp 
                ? new Date(submittedAtTimestamp.seconds * 1000).toLocaleDateString() 
                : 'Unknown';
            
            if (DEBUG && !user.idVerification?.idUrl) {
                console.warn(`User ${userId} has pending verification but no ID URL`);
            }
            
            pendingVerificationsTable.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${user.displayName || user.name || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.email || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.userType || 'User'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${submittedAt}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${user.idVerification?.idUrl ? `
                            <a href="${user.idVerification.idUrl}" target="_blank" class="text-blue-400 hover:underline flex items-center">
                                <img src="${user.idVerification.idUrl}" alt="ID Preview" class="w-12 h-8 object-cover rounded mr-2">
                                View ID
                            </a>
                        ` : 'No ID image found'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <button onclick="approveIdVerification('${userId}')" class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-1">
                            Approve
                        </button>
                        <button onclick="rejectIdVerification('${userId}')" class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                            Reject
                        </button>
                    </td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error("Error loading pending ID verifications:", error);
        
        const pendingVerificationsTable = document.getElementById('pendingIdVerifications');
        if (pendingVerificationsTable) {
            pendingVerificationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-400">
                        Error loading ID verifications: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Update verification counter in dashboard overview
async function updateVerificationCounter() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("idVerification.status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        
        const counterElement = document.getElementById('pendingVerificationsCount');
        if (counterElement) {
            counterElement.textContent = querySnapshot.size;
        }
    } catch (error) {
        console.error("Error updating verification counter:", error);
    }
}

// Approve ID verification
async function approveIdVerification(userId) {
    try {
        await updateDoc(doc(db, "users", userId), {
            "idVerification.status": "approved",
            "idVerification.verifiedAt": serverTimestamp(),
            "status": "approved" // Also update user status if it was pending
        });
        
        alert("ID verification approved successfully!");
        loadPendingIdVerifications(); // Reload the list
        
    } catch (error) {
        console.error("Error approving ID verification:", error);
        alert("Failed to approve ID verification: " + error.message);
    }
}

// Reject ID verification
async function rejectIdVerification(userId) {
    try {
        if (confirm("Are you sure you want to reject this ID verification?")) {
            await updateDoc(doc(db, "users", userId), {
                "idVerification.status": "rejected",
                "idVerification.rejectedAt": serverTimestamp(),
                "idVerification.rejectionReason": "Invalid or unclear ID document. Please upload a clearer image of a valid government-issued ID."
            });
            
            alert("ID verification rejected");
            loadPendingIdVerifications(); // Reload the list
        }
    } catch (error) {
        console.error("Error rejecting ID verification:", error);
        alert("Failed to reject ID verification: " + error.message);
    }
}

// Add functions to global scope for button handlers
window.approveIdVerification = approveIdVerification;
window.rejectIdVerification = rejectIdVerification;

// Call the function when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (DEBUG) console.log('DOM loaded - checking for pendingIdVerifications element');
    if (document.getElementById('pendingIdVerifications')) {
        if (DEBUG) console.log('Found pendingIdVerifications element - initializing');
        loadPendingIdVerifications();
    } else {
        if (DEBUG) console.log('pendingIdVerifications element not found in DOM');
    }
});
