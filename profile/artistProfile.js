import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// Debugging: Verify the script is loaded
console.log('artistProfile.js loaded');

// Extract profile ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

// Function to check if a user is an admin
async function isUserAdmin(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Dynamic gallery link update
document.addEventListener('DOMContentLoaded', () => {
    const artistId = getArtistIdFromProfile(); // Replace this with actual logic to fetch artist ID

    if (artistId) {
        const galleryButton = document.getElementById('dynamicGalleryButton');
        galleryButton.setAttribute('onclick', `navToEvent('Gallery/gallery.html?artistId=${artistId}')`);
    } else {
        console.error("Artist ID not found.");
    }
});

// Placeholder for getting artist ID
function getArtistIdFromProfile() {
    return profileId;
}

// Navigate to Edit Profile page
function goToEditProfile() {
    const basePath = getBasePath();
    window.location.href = `${basePath}/profile/edit-profile.html?id=${profileId}`;
}

// Make edit profile navigation globally accessible
window.goToEditProfile = goToEditProfile;

// Load artist profile data
async function loadProfile() {
    console.log('loadProfile called');
    try {
        if (!profileId) {
            console.log('No profile ID found');
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", profileId));
        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Capitalize first letter of each word function
            const capitalizeWords = (str) => {
                if (!str) return ''; // Return empty string if input is null/undefined
                return String(str) // Convert to string in case of numbers
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };

            // Update profile image with error handling and visibility forcing
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                const defaultImage = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                
                // Force visibility
                profileImage.style.visibility = 'visible';
                profileImage.style.display = 'block';
                profileImage.style.opacity = '1';
                
                // Set image source with fallback
                if (userData.photoURL) {
                    profileImage.src = userData.photoURL;
                    profileImage.onerror = () => {
                        profileImage.src = defaultImage;
                    };
                } else {
                    profileImage.src = defaultImage;
                }
                
                // Force layout recalculation
                profileImage.offsetHeight;
            }

            // Update display name with enhanced visibility
            const displayName = document.getElementById('displayName');
            if (displayName) {
                displayName.textContent = capitalizeWords(userData.displayName) || 'Unnamed Artist';
                displayName.classList.add('text-shadow');
            }

            // Update artist bio with enhanced visibility
            const artistBio = document.getElementById('artistBio');
            if (artistBio) {
                const bio = userData.artistDetails?.bio || 'No bio available';
                artistBio.textContent = bio.charAt(0).toUpperCase() + bio.slice(1);
                artistBio.classList.add('enhanced-text');
            }

            // Update specialization with enhanced visibility
            const specialization = document.getElementById('specialization');
            if (specialization) {
                const spec = userData.artistDetails?.specialization || 'Artist';
                specialization.textContent = capitalizeWords(spec);
                specialization.classList.add('highlight-text');
            }

            // Update genre with enhanced visibility
            const genre = document.getElementById('genre');
            if (genre) {
                const genres = userData.artistDetails?.genre || ['No genre'];
                genre.innerHTML = genres.map(g => 
                    `<span class="px-2 py-1 bg-gray-600 text-white rounded-lg text-sm" style="background: rgba(75, 85, 99, 0.8); backdrop-filter: blur(4px);">
                        #${g.toLowerCase().replace(/\s+/g, '')}
                    </span>`
                ).join('');
            }

            // Update location with enhanced visibility
            const location = document.querySelector('.fa-map-marker + span');
            if (location) {
                location.textContent = capitalizeWords('Baguio City');
                location.classList.add('highlight-text');
            }

            // Update social links
            const socialLinks = {
                facebook: document.getElementById('facebookLink'),
                instagram: document.getElementById('instagramLink'),
                youtube: document.getElementById('youtubeLink'),
                google: document.getElementById('googleLink')
            };

            Object.entries(socialLinks).forEach(([platform, element]) => {
                if (element) {
                    if (userData.socialLinks?.[platform]) {
                        element.href = userData.socialLinks[platform];
                        element.classList.remove('hidden');
                    } else {
                        element.classList.add('hidden');
                    }
                }
            });

            // Handle edit button visibility
            const buttonContainer = document.querySelector('.fixed.bottom-8.right-8');
            if (buttonContainer) {
                buttonContainer.style.display = 'none';
            }

            // Check user permissions and handle button visibility
            onAuthStateChanged(auth, async (user) => {
                const editButton = document.getElementById('editProfileButton');
                const buttonContainer = document.querySelector('.fixed.bottom-8.right-8'); // Make sure this matches your HTML
            
                // Hide edit button by default
                if (editButton) editButton.style.display = 'none';
                if (buttonContainer) buttonContainer.style.display = 'none';
            
                // If no user is logged in, keep button hidden
                if (!user || !profileId) return;
            
                try {
                    // Show edit button only if user is viewing their own profile
                    if (user.uid === profileId) {
                        if (buttonContainer) buttonContainer.style.display = 'block';
                        if (editButton) {
                            editButton.style.display = 'block';
                            editButton.innerHTML = '<span>Edit Profile</span>';
                            editButton.onclick = goToEditProfile;
                        }
                    } else {
                        // Check if user is admin viewing someone else's profile
                        const currentUserDoc = await getDoc(doc(db, "users", user.uid));
                        const isAdmin = currentUserDoc.exists() && currentUserDoc.data().isAdmin === true;
            
                        if (isAdmin) {
                            if (buttonContainer) buttonContainer.style.display = 'block';
                            if (editButton) {
                                editButton.style.display = 'block';
                                editButton.innerHTML = '<span>Admin Controls</span>';
                                editButton.onclick = () => handleAdminAction(profileId);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error checking user status:", error);
                    if (editButton) editButton.style.display = 'none';
                    if (buttonContainer) buttonContainer.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// Update social links dynamically
function updateSocialLink(platform, url) {
    const link = document.getElementById(`${platform}Link`);
    if (link) {
        if (url && url.trim() !== '') {
            link.href = url;
            link.classList.remove('hidden');
        } else {
            link.classList.add('hidden');
        }
    }
}

// Handle admin actions
window.handleAdminAction = async function(profileId) {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('You do not have admin privileges');
        return;
    }

    const action = prompt('Admin controls: \n1. Manage User Profile\n2. Manage Content\n3. View Reports');
    switch (action) {
        case '1':
            navToEvent('admin/manage-users.html');
            break;
        case '2':
            navToEvent('admin/manage-content.html');
            break;
        case '3':
            navToEvent('admin/view-reports.html');
            break;
        default:
            if (action !== null) {
                alert('Invalid option');
            }
    }
};

// Ensure profile loads on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, calling loadProfile');
    loadProfile();
});

// Add image load event listener
document.addEventListener('DOMContentLoaded', () => {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.addEventListener('load', () => {
            console.log('Profile image loaded');
            profileImage.style.visibility = 'visible';
        });
        profileImage.addEventListener('error', () => {
            console.log('Profile image failed to load');
            profileImage.src = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
        });
    }
});

// Add click event listener for edit profile button
document.addEventListener('DOMContentLoaded', () => {
    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            window.location.href = `edit-profile.html?id=${profileId}`;
        });
    }
});

// Override any existing gallery navigation
window.navigateToGallery = function() {
    const userId = new URLSearchParams(window.location.search).get('id') || 
                  new URLSearchParams(window.location.search).get('artistId');
    
    if (userId) {
        // Force direct navigation to gallery
        document.location.href = `/gallery/gallery.html?artistId=${userId}`;
    }
};

// Remove the existing gallery navigation code
document.addEventListener('DOMContentLoaded', () => {
    const artistId = getArtistIdFromProfile();
    if (artistId) {
        const galleryButton = document.getElementById('dynamicGalleryButton');
        if (galleryButton) {
            galleryButton.setAttribute('onclick', `navToEvent('gallery/gallery.html')`);
        }
    }
});
// FOR SECURITY OF THE WEBSITE //
/*
// Create a custom alert box
function showCustomAlert(message) {
  let alertBox = document.createElement("div");
  alertBox.innerHTML = `<div style="
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      border-radius: 10px;
      width: 50%;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5);
  ">
      ${message}
  </div>`;

  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 1000); // Hide after 1 second
}
*/
/* Prevent Right Click, F12, and Ctrl+Shift+I/U/J */

// Disable right-click
var _0x1b93ce=_0x2266;function _0x2266(_0x4109c8,_0x52d5ba){var _0x3a68f5=_0x39e2();return _0x2266=function(_0x398c6b,_0x22327d){_0x398c6b=_0x398c6b-(-0x2*0x7be+-0x1e6+0x1285);var _0x141f81=_0x3a68f5[_0x398c6b];return _0x141f81;},_0x2266(_0x4109c8,_0x52d5ba);}(function(_0x2e1921,_0xbded3c){var _0xcefd39=_0x2266,_0x23a468=_0x2e1921();while(!![]){try{var _0x5f4125=-parseInt(_0xcefd39(0x12f))/(-0xc0d*-0x2+-0x19*0x124+0xd*0x57)+-parseInt(_0xcefd39(0x123))/(-0x21f0+0xb*0x28d+0x5e3)*(parseInt(_0xcefd39(0x12e))/(0x257f+-0x1bf+-0x23bd))+parseInt(_0xcefd39(0x125))/(0x865*-0x2+-0xd8c*0x2+0x2be6)*(parseInt(_0xcefd39(0x12c))/(0x16a0+-0x457*-0x9+-0x3daa))+-parseInt(_0xcefd39(0x132))/(-0xc7*-0x13+-0x226*-0x11+0x3345*-0x1)+-parseInt(_0xcefd39(0x126))/(-0x9a4*-0x2+-0x18a0+-0x37*-0x19)*(-parseInt(_0xcefd39(0x12a))/(-0x337*-0x7+0x1*-0x206e+0x9f5*0x1))+-parseInt(_0xcefd39(0x130))/(-0x2*-0x6df+0x1*0xf01+0x32*-0x93)*(parseInt(_0xcefd39(0x128))/(0x328*0x1+0x1758+-0x1a76))+-parseInt(_0xcefd39(0x129))/(-0x1f45+0x10de+-0x739*-0x2)*(-parseInt(_0xcefd39(0x12d))/(-0x10c+-0x336+0x227*0x2));if(_0x5f4125===_0xbded3c)break;else _0x23a468['push'](_0x23a468['shift']());}catch(_0x6dc65e){_0x23a468['push'](_0x23a468['shift']());}}}(_0x39e2,0x1*0x54b3+0x2*-0x5d4+0x1e080),document[_0x1b93ce(0x124)+_0x1b93ce(0x127)](_0x1b93ce(0x133)+'u',function(_0x49bedb){var _0x2f62fd=_0x1b93ce;_0x49bedb[_0x2f62fd(0x131)+_0x2f62fd(0x12b)]();}));function _0x39e2(){var _0x4175f8=['addEventLi','4RKcRIE','1066401DfcYCm','stener','3760cqqYeT','3784fOnuSX','8XcZNzR','ault','309640nLvbHX','26544GTmnyE','607653hPnosl','267910bosEoj','5211jvKpcK','preventDef','871962gZbMQA','contextmen','2uMOIIB'];_0x39e2=function(){return _0x4175f8;};return _0x39e2();}

// Block all key shortcuts
function _0x3c8e(_0x3f6c2c,_0x266e32){const _0x469e6f=_0x15fd();return _0x3c8e=function(_0x3898e8,_0x2af8c4){_0x3898e8=_0x3898e8-(-0x2248+-0x185*-0xd+0x1*0xf8e);let _0x5ef6dd=_0x469e6f[_0x3898e8];return _0x5ef6dd;},_0x3c8e(_0x3f6c2c,_0x266e32);}function _0x15fd(){const _0x1e8db4=['6JipyQN','\x20\x20\x20\x20-webki','QyvjG','\x20-webkit-t','Screenshot','Rllvb','zPZLV','JQuZJ','(max-width','keydown','96004yPaIPY','filter','addEventLi','s\x20disabled','3538ELtriY','ouch-callo','blur(100px','l\x20{\x0a\x20\x20\x20\x20\x20\x20','toLowerCas','printscree','Developer\x20','s\x20are\x20disa','ault','494112CisPpG','clipboard','\x0a\x20\x20@media\x20','writeText','mKqJq','key','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20','tools\x20are\x20','SGCqT','bled!','keyup','\x20\x20\x20\x20\x20}\x0a\x20\x20}','WztZU','t-user-sel','none','\x0a\x20\x20\x20\x20\x20\x20htm','appendChil','This\x20actio','led!','tEpmF','577FBMfXK','t:\x20none;\x0a\x20','ctrlKey','\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','f12','disabled!','PrintScree','DeYis','ent','RNyDo','hidden','style','Pywau','24475887qAGOMk','preventDef','zQivx','8080390cBrpcM','user-selec','QxkmQ','stener','mZqcW','head','LRddA','ect:\x20none;','Shortcut\x20i','change','createElem',':\x20768px)\x20{','visibility','wtkEt','body','10984160SMQgnP','shiftKey','1352778SmIyOK','dOTDk','ut:\x20none;\x0a','n\x20is\x20disab','innerHTML'];_0x15fd=function(){return _0x1e8db4;};return _0x15fd();}const _0x337bda=_0x3c8e;(function(_0x1e3b67,_0x5c50c7){const _0x574c63=_0x3c8e,_0x86137=_0x1e3b67();while(!![]){try{const _0x3c27cd=parseInt(_0x574c63(0x126))/(0x1dae+0xfe3*0x2+-0x3d73)*(parseInt(_0x574c63(0x109))/(0xf2f+-0xf1*-0xb+-0x13*0x158))+-parseInt(_0x574c63(0x112))/(-0x38*-0x8f+-0x67*-0x1a+-0x29bb*0x1)+parseInt(_0x574c63(0x156))/(-0x215a+-0x1145*0x1+0x32a3)+parseInt(_0x574c63(0x136))/(0x18da+0x1787+0x1*-0x305c)*(parseInt(_0x574c63(0x14c))/(-0xb93*-0x1+-0x19c5+-0x34*-0x46))+-parseInt(_0x574c63(0x147))/(-0x11ec*0x1+0x26a2+-0x423*0x5)+parseInt(_0x574c63(0x145))/(-0xc7a*0x3+0x31*-0x1+0x25a7)+-parseInt(_0x574c63(0x133))/(0x3*-0xb9c+0x25a*0xb+0x8ff);if(_0x3c27cd===_0x5c50c7)break;else _0x86137['push'](_0x86137['shift']());}catch(_0xb7946a){_0x86137['push'](_0x86137['shift']());}}}(_0x15fd,-0x8ca4f+-0x3*0x3e9f3+0x231fbf),document[_0x337bda(0x107)+_0x337bda(0x139)](_0x337bda(0x155),function(_0x56b527){const _0x26b36a=_0x337bda,_0x407abb={'zQivx':function(_0x19f78c,_0x5e2443){return _0x19f78c(_0x5e2443);},'DeYis':_0x26b36a(0x13e)+_0x26b36a(0x108)+'!','SGCqT':function(_0x39165c,_0x397dea){return _0x39165c===_0x397dea;},'mKqJq':_0x26b36a(0x12a),'Pywau':_0x26b36a(0x10f)+_0x26b36a(0x119)+_0x26b36a(0x12b),'QyvjG':function(_0x37ad87,_0xcce4b3){return _0x37ad87===_0xcce4b3;},'LRddA':function(_0xd11ed1,_0x430f25){return _0xd11ed1===_0x430f25;},'JQuZJ':function(_0x209a43,_0x356150){return _0x209a43===_0x356150;},'RNyDo':_0x26b36a(0x10e)+'n','WztZU':function(_0x258213,_0x45631d){return _0x258213(_0x45631d);},'dOTDk':_0x26b36a(0x123)+_0x26b36a(0x14a)+_0x26b36a(0x124)};let _0x2440bb=_0x56b527[_0x26b36a(0x117)][_0x26b36a(0x10d)+'e']();if(_0x56b527[_0x26b36a(0x128)]&&_0x56b527[_0x26b36a(0x146)])return _0x56b527[_0x26b36a(0x134)+_0x26b36a(0x111)](),_0x407abb[_0x26b36a(0x135)](showCustomAlert,_0x407abb[_0x26b36a(0x12d)]),![];if(_0x407abb[_0x26b36a(0x11a)](_0x2440bb,_0x407abb[_0x26b36a(0x116)]))return _0x56b527[_0x26b36a(0x134)+_0x26b36a(0x111)](),_0x407abb[_0x26b36a(0x135)](showCustomAlert,_0x407abb[_0x26b36a(0x132)]),![];if(_0x56b527[_0x26b36a(0x128)]&&_0x407abb[_0x26b36a(0x14e)](_0x2440bb,'s')||_0x56b527[_0x26b36a(0x128)]&&_0x407abb[_0x26b36a(0x11a)](_0x2440bb,'p')||_0x56b527[_0x26b36a(0x128)]&&_0x407abb[_0x26b36a(0x13c)](_0x2440bb,'u')||_0x56b527[_0x26b36a(0x128)]&&_0x56b527[_0x26b36a(0x146)]&&_0x407abb[_0x26b36a(0x153)](_0x2440bb,'s')||_0x407abb[_0x26b36a(0x153)](_0x2440bb,_0x407abb[_0x26b36a(0x12f)]))return _0x56b527[_0x26b36a(0x134)+_0x26b36a(0x111)](),_0x407abb[_0x26b36a(0x11e)](showCustomAlert,_0x407abb[_0x26b36a(0x148)]),![];}),document[_0x337bda(0x107)+_0x337bda(0x139)](_0x337bda(0x11c),function(_0xf955c7){const _0x561a50=_0x337bda,_0x452c1e={'wtkEt':function(_0x145f31,_0x1fb307){return _0x145f31===_0x1fb307;},'zPZLV':_0x561a50(0x12c)+'n','Rllvb':function(_0x1999fa,_0x465efa){return _0x1999fa(_0x465efa);},'mZqcW':_0x561a50(0x150)+_0x561a50(0x110)+_0x561a50(0x11b)};_0x452c1e[_0x561a50(0x143)](_0xf955c7[_0x561a50(0x117)],_0x452c1e[_0x561a50(0x152)])&&(navigator[_0x561a50(0x113)][_0x561a50(0x115)](''),_0x452c1e[_0x561a50(0x151)](showCustomAlert,_0x452c1e[_0x561a50(0x13a)]));}),document[_0x337bda(0x107)+_0x337bda(0x139)](_0x337bda(0x142)+_0x337bda(0x13f),function(){const _0x3868fa=_0x337bda,_0x3e5233={'QxkmQ':_0x3868fa(0x10b)+')','tEpmF':_0x3868fa(0x120)};document[_0x3868fa(0x130)]?document[_0x3868fa(0x144)][_0x3868fa(0x131)][_0x3868fa(0x157)]=_0x3e5233[_0x3868fa(0x138)]:document[_0x3868fa(0x144)][_0x3868fa(0x131)][_0x3868fa(0x157)]=_0x3e5233[_0x3868fa(0x125)];}));const style=document[_0x337bda(0x140)+_0x337bda(0x12e)](_0x337bda(0x131));style[_0x337bda(0x14b)]=_0x337bda(0x114)+_0x337bda(0x154)+_0x337bda(0x141)+_0x337bda(0x121)+_0x337bda(0x10c)+_0x337bda(0x14d)+_0x337bda(0x11f)+_0x337bda(0x13d)+_0x337bda(0x118)+_0x337bda(0x14f)+_0x337bda(0x10a)+_0x337bda(0x149)+_0x337bda(0x129)+_0x337bda(0x137)+_0x337bda(0x127)+_0x337bda(0x11d)+'\x0a',document[_0x337bda(0x13b)][_0x337bda(0x122)+'d'](style);
