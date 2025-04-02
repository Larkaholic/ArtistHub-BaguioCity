import { db } from '../js/firebase-config.js';
import { 
    collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp,
    query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Setup Cloudinary widget for QR code uploads
let qrCodeUrl = "";
const qrCodeWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf', 
        uploadPreset: 'artist_profiles',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 5000000,
        folder: 'event_qrcodes',
        tags: ['qr_code', 'event']
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('QR Code upload successful:', result.info);
            qrCodeUrl = result.info.secure_url;
            
            // Update button to show success
            const currentRequestId = document.getElementById('currentQrCodeRequestId').value;
            const qrCodeButton = document.querySelector(`.qr-upload-btn[data-id="${currentRequestId}"]`);
            
            if (qrCodeButton) {
                qrCodeButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    QR Code Added
                `;
                qrCodeButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                qrCodeButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        } else if (error) {
            console.error('QR Code upload error:', error);
            alert('Failed to upload QR code. Please try again.');
        }
    }
);

// Function to upload QR code
export function uploadQRCode(requestId) {
    // Store the current request ID for reference after upload
    document.getElementById('currentQrCodeRequestId').value = requestId;
    qrCodeWidget.open();
}

// Helper function to format date and time properly
function formatDateTime(timestamp) {
    if (!timestamp) return 'Date not specified';
    
    // Handle various date formats
    let date;
    if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'Invalid date';
    }
    
    if (isNaN(date)) return 'Invalid date';
    
    return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Load event requests with proper debugging
export async function loadEventRequests() {
    try {
        const requestsList = document.getElementById('eventRequestsList');
        if (!requestsList) return;

        requestsList.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading event requests...</td></tr>';

        const requestsRef = collection(db, "eventRequests");
        const q = query(requestsRef, where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            requestsList.innerHTML = '<tr><td colspan="5" class="text-center py-4">No pending event requests</td></tr>';
            return;
        }

        requestsList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const request = doc.data();
            console.log("Full event request data:", request); // Debug log to see all fields
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800';

            // Get the requester's email - first check contactEmail field, then fall back to other fields
            let requesterInfo = request.contactEmail || request.requestedBy || request.createdByEmail || request.createdBy || request.userEmail || 'Unknown';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full object-cover" 
                                src="${request.imageUrl || 'https://via.placeholder.com/150'}" 
                                alt="${request.title}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${request.title}</div>
                            <div class="text-sm text-gray-400">${request.location || 'No location'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm">
                        <div class="text-white mb-2">
                            <div><span class="font-semibold">Start:</span></div>
                            <div>${formatDateTime(request.startDate)}</div>
                        </div>
                        <div class="text-white">
                            <div><span class="font-semibold">End:</span></div>
                            <div>${formatDateTime(request.endDate)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div class="text-sm">
                        <div><span class="font-semibold">Requested by:</span></div>
                        <div>${requesterInfo}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="approveEventRequest('${doc.id}')" 
                            class="text-green-400 hover:text-green-300 mr-2">
                        Approve
                    </button>
                    <button onclick="rejectEventRequest('${doc.id}')" 
                            class="text-red-400 hover:text-red-300">
                        Reject
                    </button>
                </td>
            `;
            requestsList.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading event requests:", error);
        const requestsList = document.getElementById('eventRequestsList');
        if (requestsList) {
            requestsList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading event requests</td></tr>';
        }
    }
}

// Function to approve event request
export async function approveEventRequest(requestId) {
    try {
        // First, get the request data
        const requestRef = doc(db, "eventRequests", requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
            alert("Event request not found");
            return;
        }
        
        const requestData = requestSnap.data();
        
        // Create a new event from the request data
        const eventData = {
            title: requestData.title,
            date: requestData.date,                  // Keep original date format
            startDate: requestData.date,             // Also add startDate for newer format
            location: requestData.location,
            description: requestData.description,
            organizer: requestData.contactEmail,
            contactEmail: requestData.contactEmail,  // Add contactEmail field
            createdAt: serverTimestamp(),
            imageUrl: requestData.imageUrl || "",    // Use provided image or empty string
            qrCodeUrl: qrCodeUrl || "",              // Add the QR code URL if available
            featured: false,                         // Default to not featured
            isFeatured: false                        // Also add isFeatured for compatibility
        };
        
        // Reset the global QR code URL for next upload
        qrCodeUrl = "";
        
        // Add as a new event
        await addDoc(collection(db, "events"), eventData);
        
        // Update the request status
        await updateDoc(requestRef, {
            status: "approved",
            processedAt: serverTimestamp()
        });
        
        alert("Event request approved and added to events!");
        loadEventRequests(); // Reload the requests list
        
    } catch (error) {
        console.error("Error approving event request:", error);
        alert("Failed to approve event request: " + error.message);
    }
}

// Function to reject event request
export async function rejectEventRequest(requestId) {
    try {
        if (confirm('Are you sure you want to reject and delete this event request?')) {
            const requestRef = doc(db, "eventRequests", requestId);
            
            // Delete the request document instead of updating status
            await deleteDoc(requestRef);
            
            alert("Event request rejected and removed from the system");
            loadEventRequests(); // Reload the requests list
        }
    } catch (error) {
        console.error("Error rejecting event request:", error);
        alert("Failed to reject event request: " + error.message);
    }
}

// Make these functions globally available
window.approveEventRequest = approveEventRequest;
window.rejectEventRequest = rejectEventRequest;
window.uploadQRCode = uploadQRCode;

// Initialize the page by loading requests when script is imported
document.addEventListener('DOMContentLoaded', function() {
    loadEventRequests();
    
    // Add a hidden input to store the current request ID being processed
    if (!document.getElementById('currentQrCodeRequestId')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'currentQrCodeRequestId';
        document.body.appendChild(input);
    }
});
