import { auth, db } from '../js/firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Add your Cloudinary configuration
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dxeyr4pvf/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'artist_profiles';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'profile.html';
            return;
        }

        try {
            // Load existing profile data
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                
                // Fill in the form with existing data
                document.getElementById('displayName').value = data.displayName || '';
                document.getElementById('specialization').value = data.artistDetails?.specialization || '';
                document.getElementById('bio').value = data.artistDetails?.bio || '';
                document.getElementById('facebook').value = data.socialLinks?.facebook || '';
                document.getElementById('instagram').value = data.socialLinks?.instagram || '';
                document.getElementById('youtube').value = data.socialLinks?.youtube || '';
                document.getElementById('google').value = data.socialLinks?.google || '';
                
                if (data.photoURL) {
                    document.getElementById('profileImage').src = data.photoURL;
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
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
            let updates = {
                displayName: document.getElementById('displayName').value,
                artistDetails: {
                    specialization: document.getElementById('specialization').value,
                    bio: document.getElementById('bio').value
                },
                socialLinks: {
                    facebook: document.getElementById('facebook').value,
                    instagram: document.getElementById('instagram').value,
                    youtube: document.getElementById('youtube').value,
                    google: document.getElementById('google').value
                }
            };

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
}); 