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

// Function to load all event requests
export async function loadEventRequests() {
    try {
        const eventRequestsRef = collection(db, "eventRequests");
        const q = query(eventRequestsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const requestsContainer = document.getElementById('eventRequestsList');
        requestsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            requestsContainer.innerHTML = `
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <p class="text-gray-400">No event addition requests at this time.</p>
                </div>
            `;
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const request = doc.data();
            const requestId = doc.id;
            const date = request.date ? new Date(request.date).toLocaleDateString() : 'No date specified';
            const createdAt = request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'Unknown';
            
            requestsContainer.innerHTML += `
                <div class="bg-gray-800 rounded-lg p-4 request-item" data-id="${requestId}">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-semibold text-white">${request.title}</h3>
                            <p class="text-sm text-gray-400">Submitted on: ${createdAt}</p>
                            <p class="text-sm text-gray-300 mt-2"><strong>Date:</strong> ${date}</p>
                            <p class="text-sm text-gray-300"><strong>Location:</strong> ${request.location || 'Not specified'}</p>
                            <p class="text-sm text-gray-300"><strong>Contact:</strong> ${request.contactEmail}</p>
                            <div class="mt-2">
                                <p class="text-sm text-gray-300"><strong>Description:</strong></p>
                                <p class="text-sm text-gray-400">${request.description || 'No description provided'}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-800 text-yellow-300' : 
                            request.status === 'approved' ? 'bg-green-800 text-green-300' : 
                            'bg-red-800 text-red-300'
                        }">${request.status}</span>
                    </div>
                    
                    ${request.status === 'pending' ? `
                        <div class="flex mt-4 space-x-2 justify-end">
                            <button onclick="uploadQRCode('${requestId}')" 
                                    class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center qr-upload-btn" data-id="${requestId}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Upload QR Code
                            </button>
                            <button onclick="approveEventRequest('${requestId}')" 
                                    class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                                Approve
                            </button>
                            <button onclick="rejectEventRequest('${requestId}')" 
                                    class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
    } catch (error) {
        console.error("Error loading event requests:", error);
        const requestsContainer = document.getElementById('eventRequestsList');
        requestsContainer.innerHTML = `
            <div class="bg-red-800 rounded-lg p-4 text-center">
                <p class="text-white">Error loading requests. Please try again.</p>
            </div>
        `;
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
