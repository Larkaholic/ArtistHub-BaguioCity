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

// Load pending ID verifications
export async function loadPendingIdVerifications() {
    try {
        const pendingVerificationsTable = document.getElementById('pendingIdVerifications');
        
        // Check if the element exists before proceeding
        if (!pendingVerificationsTable) {
            console.log('Element #pendingIdVerifications not found in DOM. Skipping ID verifications load.');
            return;
        }
        
        const usersRef = collection(db, "users");
        
        // Query for users with pending ID verification
        const q = query(
            usersRef, 
            where("idVerification.status", "==", "pending")
        );
        
        const querySnapshot = await getDocs(q);
        
        pendingVerificationsTable.innerHTML = '';
        
        if (querySnapshot.empty) {
            pendingVerificationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-400">No pending ID verifications found.</td>
                </tr>
            `;
            return;
        }
        
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
            const submittedAt = user.idVerification?.submittedAt?.toDate 
                ? new Date(user.idVerification.submittedAt.toDate()).toLocaleDateString() 
                : 'Unknown';
            
            pendingVerificationsTable.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${user.name || user.displayName || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.email || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.userType || 'User'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${submittedAt}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <a href="${user.idVerification?.idUrl}" target="_blank" class="text-blue-400 hover:underline flex items-center">
                            <img src="${user.idVerification?.idUrl}" alt="ID Preview" class="w-12 h-8 object-cover rounded mr-2">
                            View
                        </a>
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
        // Check if the element exists before setting innerHTML
        if (pendingVerificationsTable) {
            pendingVerificationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-400">Error loading ID verifications. Please try again.</td>
                </tr>
            `;
        }
    }
}

// Approve ID verification
export async function approveIdVerification(userId) {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            "idVerification.status": "approved",
            "idVerification.verifiedAt": serverTimestamp(),
            "status": "approved" // Also update user status if it was pending
        });
        
        alert("ID verification approved successfully");
        loadPendingIdVerifications(); // Reload the list
        
    } catch (error) {
        console.error("Error approving ID verification:", error);
        alert("Failed to approve ID verification: " + error.message);
    }
}

// Reject ID verification
export async function rejectIdVerification(userId) {
    try {
        if (confirm("Are you sure you want to reject this ID verification? The user will need to upload a new ID.")) {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                "idVerification.status": "rejected",
                "idVerification.rejectedAt": serverTimestamp(),
                "status": "rejected" // Update user status to rejected
            });
            
            alert("ID verification rejected");
            loadPendingIdVerifications(); // Reload the list
        }
    } catch (error) {
        console.error("Error rejecting ID verification:", error);
        alert("Failed to reject ID verification: " + error.message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('pendingIdVerifications')) {
        loadPendingIdVerifications();
    } else {
        console.log('ID verification section not found in DOM. ID verification module not initialized.');
    }
});
