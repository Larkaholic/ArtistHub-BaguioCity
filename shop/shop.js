import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

let allArtworks = []; // Store all artworks for filtering

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadArtworks();

    // Add event listeners for genre buttons
    const genreButtons = document.querySelectorAll('.genre-btn');
    genreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons
            genreButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            e.target.closest('.genre-btn').classList.add('active');
            // Apply filters
            applyFilters();
        });
    });

    // Add search button click handler
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }

    // Add search input handler for "Enter" key
    const searchInput = document.getElementById('searchArtworks');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // Add filter change handlers
    const filters = ['genreFilter', 'categoryFilter', 'sizeFilter', 'mediumFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });
});

async function loadArtworks() {
    const galleryContainer = document.getElementById('galleryContainer');
    
    try {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">Loading artworks...</p>';

        const querySnapshot = await getDocs(collection(db, 'gallery_images'));
        
        if (querySnapshot.empty) {
            galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found.</p>';
            return;
        }

        allArtworks = []; // Reset the array
        querySnapshot.forEach((doc) => {
            allArtworks.push({ id: doc.id, ...doc.data() });
        });

        applyFilters(); // Initial display with filters
    } catch (error) {
        console.error('Error loading artworks:', error);
        galleryContainer.innerHTML = '<p class="text-center col-span-full text-red-500">Error loading artworks.</p>';
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchArtworks')?.value.toLowerCase() || '';
    const activeGenre = document.querySelector('.genre-btn.active')?.dataset.genre || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const medium = document.getElementById('mediumFilter')?.value || '';

    const filteredArtworks = allArtworks.filter(artwork => {
        const matchesSearch = !searchTerm || 
            artwork.title?.toLowerCase().includes(searchTerm) ||
            artwork.description?.toLowerCase().includes(searchTerm) ||
            artwork.artist?.toLowerCase().includes(searchTerm);

        const matchesGenre = !activeGenre || artwork.genre === activeGenre;
        const matchesSize = !size || artwork.size === size;
        const matchesMedium = !medium || artwork.medium === medium;

        return matchesSearch && matchesGenre && matchesSize && matchesMedium;
    });

    displayArtworks(filteredArtworks);
}

// Add genre icons mapping
const genreIcons = {
    'traditional': 'paint-brush',
    'contemporary': 'shapes',
    'abstract': 'draw-polygon',
    'photography': 'camera',
    'digital': 'desktop',
    'sculpture': 'cube',
    'mixed-media': 'layer-group',
    'default': 'palette'
};

function displayArtworks(artworks) {
    const galleryContainer = document.getElementById('galleryContainer');
    galleryContainer.innerHTML = '';

    if (artworks.length === 0) {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found.</p>';
        return;
    }

    artworks.forEach((artwork) => {
        const genreIcon = genreIcons[artwork.genre?.toLowerCase()] || genreIcons.default;
        const card = createArtworkCard(artwork.id, artwork, genreIcon);
        galleryContainer.appendChild(card);
    });
}

function createArtworkCard(id, data, genreIcon) {
    const card = document.createElement('div');
    card.className = 'artwork-card bg-white rounded-lg shadow-lg overflow-hidden';
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}" class="artwork-image w-full h-48 object-cover">
        <div class="p-6">
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${genreIcon} text-xl text-gray-600"></i>
                    <h3 class="artwork-title text-xl font-bold">${data.title}</h3>
                </div>
                <div class="flex justify-between items-center">
                    <p class="artwork-price text-lg font-semibold text-green-600">₱${parseFloat(data.price || 0).toFixed(2)}</p>
                    <span class="text-sm text-gray-500"><i class="fas fa-${genreIcon}"></i> ${data.genre || 'Art'}</span>
                </div>
            </div>
            <p class="artwork-description mt-2 text-gray-600">${data.description || 'No description available.'}</p>
            ${auth.currentUser ? 
                `<button onclick="window.addToCart('${id}', '${data.title}', ${parseFloat(data.price)})" 
                    class="artwork-button mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200">
                    <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                </button>` :
                `<button onclick="window.toggleLoginFlyout()" 
                    class="artwork-button mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
                    <i class="fas fa-sign-in-alt mr-2"></i> Login to Add to Cart
                </button>`
            }
        </div>
    `;
    return card;
}

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
