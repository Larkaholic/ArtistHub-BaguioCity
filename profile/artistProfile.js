import { auth } from '../firebase-config.js';
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const db = getFirestore();
const storage = getStorage();

// Check if user is an artist and show edit controls
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        if (userData.userType === 'artist') {
            showEditControls();
            loadArtistData(userData);
        }
    }
});

function showEditControls() {
    const profileContent = document.querySelector('.artist-profile-content');
    profileContent.innerHTML = `
        <div class="edit-profile glass-header p-4 rounded-lg">
            <h2 class="text-2xl font-bold mb-4">Edit Profile</h2>
            <form id="artistProfileForm">
                <div class="mb-4">
                    <label class="block mb-2">Profile Image</label>
                    <input type="file" id="profileImage" accept="image/*" class="mb-2">
                    <img id="currentProfileImage" class="w-32 h-32 object-cover rounded-full" src="" alt="Profile">
                </div>
                
                <div class="mb-4">
                    <label class="block mb-2">Display Name</label>
                    <input type="text" id="displayName" class="w-full p-2 rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block mb-2">Artist Bio</label>
                    <textarea id="artistBio" class="w-full p-2 rounded" rows="4"></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block mb-2">Social Media Links</label>
                    <input type="url" id="facebook" placeholder="Facebook" class="w-full p-2 rounded mb-2">
                    <input type="url" id="instagram" placeholder="Instagram" class="w-full p-2 rounded mb-2">
                    <input type="url" id="youtube" placeholder="YouTube" class="w-full p-2 rounded mb-2">
                    <input type="url" id="google" placeholder="Google" class="w-full p-2 rounded">
                </div>
                
                <button type="submit" class="glass-header text-white py-2 px-4 rounded-md hover:bg-gray-300 hover:text-black">
                    Save Changes
                </button>
            </form>
        </div>
    `;

    // Add event listeners
    document.getElementById('artistProfileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('profileImage').addEventListener('change', handleImagePreview);
}

async function loadArtistData(userData) {
    document.getElementById('displayName').value = userData.displayName || '';
    document.getElementById('artistBio').value = userData.artistDetails?.bio || '';
    document.getElementById('facebook').value = userData.socialLinks?.facebook || '';
    document.getElementById('instagram').value = userData.socialLinks?.instagram || '';
    document.getElementById('youtube').value = userData.socialLinks?.youtube || '';
    document.getElementById('google').value = userData.socialLinks?.google || '';
    
    if (userData.photoURL) {
        document.getElementById('currentProfileImage').src = userData.photoURL;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
        const imageFile = document.getElementById('profileImage').files[0];
        let photoURL = user.photoURL;

        if (imageFile) {
            const imageRef = ref(storage, `profile-images/${user.uid}`);
            await uploadBytes(imageRef, imageFile);
            photoURL = await getDownloadURL(imageRef);
        }

        await updateDoc(doc(db, "users", user.uid), {
            displayName: document.getElementById('displayName').value,
            photoURL: photoURL,
            artistDetails: {
                bio: document.getElementById('artistBio').value
            },
            socialLinks: {
                facebook: document.getElementById('facebook').value,
                instagram: document.getElementById('instagram').value,
                youtube: document.getElementById('youtube').value,
                google: document.getElementById('google').value
            }
        });

        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('currentProfileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
} 