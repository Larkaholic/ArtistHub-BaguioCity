function showInstructions(platform) {
    const instructions = {
        facebook: "1. Open the Facebook app on your phone.\n2. Go to your profile.\n3. Tap the three dots (•••) on the top-right.\n4. Tap 'Copy Link' or 'Copy URL'.\n5. Paste the link here.",
        instagram: "1. Open the Instagram app.\n2. Go to your profile page.\n3. Tap the three dots (•••) on the top-right.\n4. Tap 'Copy Profile URL'.\n5. Paste the link here.",
        youtube: "1. Open the YouTube app.\n2. Go to your channel.\n3. Tap the three dots (•••) on the top-right.\n4. Tap 'Copy Link'.\n5. Paste the link here.",
        google: "1. Open the Google app.\n2. Go to your Google profile or business page.\n3. Tap the three dots (•••) on the top-right.\n4. Tap 'Share' and then 'Copy Link'.\n5. Paste the link here."
    };
    document.getElementById('instructionsText').innerText = instructions[platform];
    document.getElementById('instructionsModal').classList.remove('hidden');
}

// Function to close the instructions modal when clicking outside of it
function closeInstructions(event) {
    if (event.target === event.currentTarget) {
        document.getElementById('instructionsModal').classList.add('hidden');
    }
}

window.showInstructions = showInstructions;
window.closeInstructions = closeInstructions;

import { auth, db } from '../js/firebase-config.js';
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleAuthProvider, linkWithPopup, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// add your Cloudinary configuration
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dxeyr4pvf/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'artist_profiles';
// Change this to use the existing upload preset instead of a non-existent one
const CLOUDINARY_ID_UPLOAD_PRESET = 'artist_profiles'; // Use the existing preset

// Variable to store the uploaded ID URL
let uploadedIdUrl = null;

// Set up Cloudinary ID upload widget
const idUploadWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf',
        uploadPreset: CLOUDINARY_ID_UPLOAD_PRESET,
        sources: ['local', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 5000000, // 5MB max
        folder: 'user_ids', // Still save in the user_ids folder
        tags: ['id_verification'],
        resourceType: 'image'
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('ID upload successful:', result.info);
            
            // Store the uploaded ID URL
            uploadedIdUrl = result.info.secure_url;
            
            // Show the ID preview
            const idPreviewContainer = document.getElementById('idPreviewContainer');
            const idPreviewImage = document.getElementById('idPreviewImage');
            
            if (idPreviewContainer && idPreviewImage) {
                idPreviewImage.src = uploadedIdUrl;
                idPreviewContainer.classList.remove('hidden');
            }
            
            // Update upload button to show success
            const uploadButton = document.getElementById('uploadIdButton');
            if (uploadButton) {
                uploadButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    ID Uploaded Successfully
                `;
                uploadButton.className = 'bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center gap-2';
            }
        } else if (error) {
            console.error('ID upload error:', error);
            alert('Error uploading ID. Please try again.');
        }
    }
);

// Function to handle ID upload
function uploadId() {
    idUploadWidget.open();
}

// Function to remove uploaded ID
function removeUploadedId() {
    uploadedIdUrl = null;
    
    const idPreviewContainer = document.getElementById('idPreviewContainer');
    const uploadButton = document.getElementById('uploadIdButton');
    
    if (idPreviewContainer) {
        idPreviewContainer.classList.add('hidden');
    }
    
    if (uploadButton) {
        uploadButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload ID for Verification
        `;
        uploadButton.className = 'bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2';
    }
}

// Function to check the user's verification status
async function checkVerificationStatus(userData) {
    const verificationStatus = document.getElementById('verificationStatus');
    const verificationMessage = document.getElementById('verificationMessage');
    const uploadButton = document.getElementById('uploadIdButton');
    
    if (!verificationStatus || !verificationMessage || !uploadButton) {
        console.error('Verification elements not found');
        return;
    }
    
    if (!userData.idVerification) {
        // No verification data - needs to upload ID
        verificationStatus.textContent = 'Not Verified';
        verificationStatus.className = 'text-red-600 font-semibold';
        
        verificationMessage.innerHTML = `
            <div class="bg-yellow-100 text-yellow-800 p-3 rounded-md">
                <p class="font-semibold">Your account requires ID verification.</p>
                <p class="text-sm">Please upload a valid government ID to complete your registration.</p>
            </div>
        `;
        verificationMessage.classList.remove('hidden');
        
        uploadButton.disabled = false;
        return;
    }
    
    // ID exists, check status
    switch (userData.idVerification.status) {
        case 'pending':
            verificationStatus.textContent = 'Pending Review';
            verificationStatus.className = 'text-yellow-600 font-semibold';
            
            verificationMessage.innerHTML = `
                <div class="bg-yellow-100 text-yellow-800 p-3 rounded-md">
                    <p class="font-semibold">Your ID is pending review.</p>
                    <p class="text-sm">We'll notify you once your verification is complete.</p>
                </div>
            `;
            verificationMessage.classList.remove('hidden');
            
            // Disable upload button
            uploadButton.disabled = true;
            uploadButton.className = 'bg-gray-400 text-gray-700 px-4 py-2 rounded-md cursor-not-allowed flex items-center gap-2';
            uploadButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                ID Under Review
            `;
            break;
            
        case 'approved':
            verificationStatus.textContent = 'Verified';
            verificationStatus.className = 'text-green-600 font-semibold';
            
            verificationMessage.innerHTML = `
                <div class="bg-green-100 text-green-800 p-3 rounded-md">
                    <p class="font-semibold">Your ID has been verified.</p>
                    <p class="text-sm">Thank you for completing the verification process.</p>
                </div>
            `;
            verificationMessage.classList.remove('hidden');
            
            // Hide upload button - no longer needed
            uploadButton.disabled = true;
            uploadButton.className = 'hidden';
            break;
            
        case 'rejected':
            verificationStatus.textContent = 'Rejected';
            verificationStatus.className = 'text-red-600 font-semibold';
            
            verificationMessage.innerHTML = `
                <div class="bg-red-100 text-red-800 p-3 rounded-md">
                    <p class="font-semibold">Your ID verification was rejected.</p>
                    <p class="text-sm">Please upload a new, clearer ID document.</p>
                </div>
            `;
            verificationMessage.classList.remove('hidden');
            
            // Enable upload button for re-submission
            uploadButton.disabled = false;
            break;
            
        default:
            verificationStatus.textContent = 'Unknown';
            verificationStatus.className = 'text-gray-600 font-semibold';
            break;
    }
}

// Function to add genre tag
function addGenreTag() {
    const genreInput = document.getElementById('genreInput');
    const genre = genreInput.value.trim();
    if (genre !== '') {
        const genreContainer = document.getElementById('genreContainer');
        const genreTag = document.createElement('span');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.className = 'remove-genre-btn';
        removeBtn.onclick = () => genreContainer.removeChild(genreTag);
        genreTag.appendChild(removeBtn);
        genreContainer.appendChild(genreTag); // Add the new genre tag at the end
        genreInput.value = '';
    }
}

// Function to get genres from tags
function getGenres() {
    const genreContainer = document.getElementById('genreContainer');
    return Array.from(genreContainer.children).map(tag => tag.textContent.slice(0, -1));
}

// Update the auth state listener at the top of the file
document.addEventListener('DOMContentLoaded', async () => {
    // Set up the ID upload button
    const uploadIdButton = document.getElementById('uploadIdButton');
    if (uploadIdButton) {
        uploadIdButton.addEventListener('click', uploadId);
    }
    
    // Set up the remove ID button
    const removeIdButton = document.getElementById('removeIdButton');
    if (removeIdButton) {
        removeIdButton.addEventListener('click', removeUploadedId);
    }
    
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'profile.html';
            return;
        }

        // Get fresh user data after each auth state change
        const freshUser = auth.currentUser;
        await freshUser.reload();
        
        console.log('Auth state changed, providers:', freshUser.providerData);
        
        // Check if Google is among the providers
        const isGoogleLinked = freshUser.providerData.some(
            provider => provider.providerId === 'google.com'
        );
        
        console.log('Initial Google link check:', isGoogleLinked);

        // Update UI immediately based on provider data
        updateBindingUI(isGoogleLinked);
        
        // Load rest of profile data
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            // Disable image upload if status is pending
            const imageUploadSection = document.getElementById('imageUploadSection');
            const profileImageInput = document.getElementById('imageInput');
            
            if (userData.status === 'pending') {
                if (imageUploadSection) imageUploadSection.style.display = 'none';
                if (profileImageInput) profileImageInput.disabled = true;
                
                // add pending notice
                const pendingNotice = document.createElement('div');
                pendingNotice.className = 'text-yellow-500 text-center mb-4';
                pendingNotice.innerHTML = 'Your profile is pending admin approval. You will be able to upload images once approved.';
                document.querySelector('form').prepend(pendingNotice);
            }

            // load existing profile data
            if (userDoc.exists()) {
                const data = userDoc.data();
                
                // Show status message if pending/rejected
                if (data.status !== 'approved') {
                    const statusMessage = document.createElement('div');
                    statusMessage.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4';
                    statusMessage.innerHTML = `
                        <p class="font-bold">Profile status: ${data.status}</p>
                        <p>${data.status === 'pending' 
                            ? 'Your profile is pending admin approval. You can still edit your details.' 
                            : 'Your profile has been rejected. Please contact admin for more information.'}
                        </p>
                    `;
                    document.getElementById('editProfileForm').prepend(statusMessage);
                }
                
                // Fill in the form with existing data
                document.getElementById('displayName').value = data.displayName || '';
                document.getElementById('specialization').value = data.artistDetails?.specialization || '';
                document.getElementById('bio').value = data.artistDetails?.bio || '';
                document.getElementById('facebook').value = data.socialLinks?.facebook || '';
                document.getElementById('instagram').value = data.socialLinks?.instagram || '';
                document.getElementById('youtube').value = data.socialLinks?.youtube || '';
                document.getElementById('google').value = data.socialLinks?.google || '';
                
                // Load genres
                const genreContainer = document.getElementById('genreContainer');
                if (data.artistDetails?.genre) {
                    data.artistDetails.genre.forEach(genre => {
                        const genreTag = document.createElement('span');
                        genreTag.className = 'genre-tag';
                        genreTag.textContent = genre;
                        const removeBtn = document.createElement('button');
                        removeBtn.textContent = 'x';
                        removeBtn.className = 'remove-genre-btn';
                        removeBtn.onclick = () => genreContainer.removeChild(genreTag);
                        genreTag.appendChild(removeBtn);
                        genreContainer.appendChild(genreTag);
                    });
                }
                
                if (data.photoURL) {
                    document.getElementById('profileImage').src = data.photoURL;
                }
                
                // Check verification status
                checkVerificationStatus(data);
                
                // If the user has a pending ID verification, show the preview
                if (data.idVerification && data.idVerification.idUrl) {
                    const idPreviewContainer = document.getElementById('idPreviewContainer');
                    const idPreviewImage = document.getElementById('idPreviewImage');
                    
                    if (idPreviewContainer && idPreviewImage) {
                        idPreviewImage.src = data.idVerification.idUrl;
                        idPreviewContainer.classList.remove('hidden');
                        
                        // Store the current ID URL for form submission
                        uploadedIdUrl = data.idVerification.idUrl;
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to update your profile');
            return;
        }

        try {
            // Get the user document first to check current verification status
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            let updates = {
                displayName: document.getElementById('displayName').value,
                artistDetails: {
                    specialization: document.getElementById('specialization').value,
                    bio: document.getElementById('bio').value,
                    genre: getGenres()
                },
                socialLinks: {
                    facebook: document.getElementById('facebook').value,
                    instagram: document.getElementById('instagram').value,
                    youtube: document.getElementById('youtube').value,
                    google: document.getElementById('google').value
                }
            };

            // Handle ID verification updates
            if (uploadedIdUrl) {
                // Check if this is a new ID or an update to a rejected one
                if (!userData.idVerification || 
                    userData.idVerification.status === 'rejected' || 
                    !userData.idVerification.idUrl) {
                    
                    updates.idVerification = {
                        idUrl: uploadedIdUrl,
                        status: 'pending',
                        submittedAt: serverTimestamp()
                    };
                    
                    // If status was rejected, preserve the rejection reason
                    if (userData.idVerification && userData.idVerification.rejectionReason) {
                        updates.idVerification.previousRejectionReason = userData.idVerification.rejectionReason;
                    }
                }
            }

            // Handle image upload with Cloudinary
            const imageInput = document.getElementById('imageInput');
            if (imageInput.files.length > 0) {
                try {
                    const file = imageInput.files[0];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                    // Show loading state
                    const submitButton = document.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    submitButton.textContent = 'Uploading...';

                    // Upload to Cloudinary
                    const response = await fetch(CLOUDINARY_URL, {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Failed to upload image');
                    }

                    const data = await response.json();
                    updates.photoURL = data.secure_url;

                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.textContent = 'Save Changes';
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Failed to upload image. Please try again.');
                    return;
                }
            }

            // Update the user document
            await updateDoc(doc(db, "users", user.uid), updates);
            
            alert('Profile updated successfully!');
            window.location.href = 'profile.html';
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(`Error updating profile: ${error.message}`);
        }
    });

    // Handle cancel button click
    document.getElementById('cancelButton').addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        window.location.href = 'profile.html'; // Redirect to profile page
    });

    // Improve image preview handling
    document.getElementById('imageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // 5MB limit
            if (file.size > 5 * 1024 * 1024) {
                alert('Please select an image smaller than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profileImage').src = e.target.result;
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e);
                alert('Error reading file. Please try again.');
            };
            reader.readAsDataURL(file);
        }
    });

    // Add event listener for genre input
    document.getElementById('addGenreButton').addEventListener('click', addGenreTag);
});

// Add new helper function to force status update
async function forceUpdateBindingStatus(user) {
    if (!user) return;
    
    console.log('Force updating binding status');
    try {
        // Force a refresh of the user's token
        await user.reload();
        console.log('User reloaded:', user);
        
        // Get fresh provider data
        const providers = user.providerData;
        console.log('Provider data:', providers);
        
        // Check if any provider is Google
        const isGoogleLinked = providers.some(provider => provider.providerId === 'google.com');
        console.log('Is Google linked:', isGoogleLinked);

        // Get UI elements once
        const elements = {
            statusSpan: document.getElementById('bindingStatus'),
            bindButton: document.getElementById('bindGoogleBtn'),
            buttonText: document.getElementById('bindGoogleBtnText')
        };

        // Verify all elements exist
        if (!elements.statusSpan || !elements.bindButton || !elements.buttonText) {
            console.error('Missing UI elements:', elements);
            return;
        }

        // Force immediate UI update
        requestAnimationFrame(() => {
            if (isGoogleLinked) {
                console.log('Setting UI to connected state');
                elements.statusSpan.textContent = 'Connected';
                elements.statusSpan.className = 'text-green-600 font-semibold';
                elements.buttonText.textContent = 'Google Account Connected';
                elements.bindButton.disabled = true;
                elements.bindButton.className = 'bg-gray-100 text-gray-500 px-6 py-2 rounded-lg border-2 border-gray-300 flex items-center gap-2 cursor-not-allowed';
                
                // Force DOM reflow
                elements.statusSpan.style.display = 'none';
                elements.statusSpan.offsetHeight;
                elements.statusSpan.style.display = 'inline';
                
                // Double-check the update
                console.log('Status after update:', elements.statusSpan.textContent);
                console.log('Button state after update:', elements.bindButton.disabled);
            } else {
                console.log('Setting UI to disconnected state');
                elements.statusSpan.textContent = 'Not Connected';
                elements.statusSpan.className = 'text-red-600 font-semibold';
                elements.buttonText.textContent = 'Bind Google Account';
                elements.bindButton.disabled = false;
                elements.bindButton.className = 'bg-white text-black px-6 py-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 flex items-center gap-2';
            }
        });

    } catch (error) {
        console.error('Error checking binding status:', error);
        const statusSpan = document.getElementById('bindingStatus');
        if (statusSpan) {
            statusSpan.textContent = 'Error checking status';
            statusSpan.className = 'text-red-600 font-semibold';
        }
    }
}

// Add new function to update UI
function updateBindingUI(isLinked) {
    const elements = {
        statusSpan: document.getElementById('bindingStatus'),
        bindButton: document.getElementById('bindGoogleBtn'),
        buttonText: document.getElementById('bindGoogleBtnText')
    };

    if (!elements.statusSpan || !elements.bindButton || !elements.buttonText) {
        console.error('Missing UI elements');
        return;
    }

    if (isLinked) {
        console.log('Updating UI to connected state');
        elements.statusSpan.textContent = 'Connected';
        elements.statusSpan.className = 'text-green-600 font-semibold';
        elements.buttonText.textContent = 'Google Account Connected';
        elements.bindButton.disabled = true;
        elements.bindButton.className = 'bg-gray-100 text-gray-500 px-6 py-2 rounded-lg border-2 border-gray-300 flex items-center gap-2 cursor-not-allowed';
    } else {
        console.log('Updating UI to disconnected state');
        elements.statusSpan.textContent = 'Not Connected';
        elements.statusSpan.className = 'text-red-600 font-semibold';
        elements.buttonText.textContent = 'Bind Google Account';
        elements.bindButton.disabled = false;
        elements.bindButton.className = 'bg-white text-black px-6 py-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 flex items-center gap-2';
    }
}

// Update the handleGoogleBinding function
async function handleGoogleBinding() {
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        return;
    }

    try {
        console.log('Starting Google account binding process');
        const provider = new GoogleAuthProvider();
        const result = await linkWithPopup(user, provider);
        
        console.log('Google account linked successfully', result);
        
        // Force immediate UI update
        updateBindingUI(true);
        
        // Show success message
        alert('Google account successfully linked!');
        
        // Reload the page
        window.location.reload();
        
    } catch (error) {
        console.error('Error linking Google account:', error);
        if (error.code === 'auth/credential-already-in-use') {
            alert('This Google account is already linked to another profile.');
        } else {
            alert('Failed to link Google account. Please try again.');
        }
    }
}

// Update the old updateGoogleBindingStatus function to use the new force update
async function updateGoogleBindingStatus(user) {
    await forceUpdateBindingStatus(user);
}

// Make functions globally available
window.handleGoogleBinding = handleGoogleBinding;
window.forceUpdateBindingStatus = forceUpdateBindingStatus;
window.updateGoogleBindingStatus = updateGoogleBindingStatus;
window.uploadId = uploadId;
window.removeUploadedId = removeUploadedId;