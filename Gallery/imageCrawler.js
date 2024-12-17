import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

class ImageCrawler {
    constructor() {
        this.searchEngines = [
            {
                name: 'Google',
                url: 'https://www.google.com/searchbyimage?q='
            },
            {
                name: 'TinEye',
                url: 'https://www.tineye.com/search?url='
            },
            {
                name: 'Bing',
                url: 'https://www.bing.com/images/search?q='
            }
        ];
    }

    // Check if image ID exists in our database
    async checkImageInDatabase(imageId) {
        try {
            const q = query(collection(db, 'gallery_images'), where('imageId', '==', imageId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return {
                    exists: false,
                    message: 'Image not found in our database.'
                };
            }

            const imageData = querySnapshot.docs[0].data();
            return {
                exists: true,
                data: imageData,
                message: 'Image found in our database.',
                uploadedBy: imageData.artistEmail,
                uploadDate: imageData.createdAt
            };
        } catch (error) {
            console.error('Error checking image in database:', error);
            throw new Error('Failed to check image in database');
        }
    }

    // Generate search URLs for reverse image search
    generateSearchUrls(imageUrl) {
        return this.searchEngines.map(engine => ({
            name: engine.name,
            url: `${engine.url}${encodeURIComponent(imageUrl)}`
        }));
    }

    // Create crawler UI for admins
    createCrawlerUI() {
        const container = document.createElement('div');
        container.className = 'crawler-container';
        container.innerHTML = `
            <div class="crawler-form bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-bold mb-4">Image Crawler (Admin Only)</h3>
                <div class="mb-4">
                    <input type="text" id="imageIdInput" 
                           class="w-full p-2 border rounded" 
                           placeholder="Enter Image ID (e.g., AHB-timestamp-number)">
                </div>
                <button id="checkImageBtn" 
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Check Image
                </button>
                <div id="crawlerResults" class="mt-4"></div>
            </div>
        `;

        // Add event listener to check button
        container.querySelector('#checkImageBtn').addEventListener('click', async () => {
            const imageId = document.getElementById('imageIdInput').value.trim();
            if (!imageId) {
                alert('Please enter an Image ID');
                return;
            }

            const resultsDiv = document.getElementById('crawlerResults');
            resultsDiv.innerHTML = '<p class="text-gray-500">Checking image...</p>';

            try {
                const result = await this.checkImageInDatabase(imageId);
                if (result.exists) {
                    const searchUrls = this.generateSearchUrls(result.data.imageUrl);
                    
                    resultsDiv.innerHTML = `
                        <div class="bg-green-100 p-4 rounded mt-4">
                            <p class="text-green-700">${result.message}</p>
                            <p class="mt-2">Uploaded by: ${result.uploadedBy}</p>
                            <p>Upload date: ${new Date(result.uploadDate).toLocaleString()}</p>
                            <div class="mt-4">
                                <p class="font-bold">Check for duplicates:</p>
                                <ul class="list-disc pl-5 mt-2">
                                    ${searchUrls.map(engine => `
                                        <li class="mt-1">
                                            <a href="${engine.url}" 
                                               target="_blank" 
                                               class="text-blue-500 hover:underline">
                                                Search on ${engine.name}
                                            </a>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    `;
                } else {
                    resultsDiv.innerHTML = `
                        <div class="bg-red-100 p-4 rounded mt-4">
                            <p class="text-red-700">${result.message}</p>
                        </div>
                    `;
                }
            } catch (error) {
                resultsDiv.innerHTML = `
                    <div class="bg-red-100 p-4 rounded mt-4">
                        <p class="text-red-700">Error: ${error.message}</p>
                    </div>
                `;
            }
        });

        return container;
    }
}

// Initialize crawler for admin use
async function initImageCrawler() {
    if (!auth.currentUser) return;

    const adminEmails = ['admin@artisthub.com', 'developer@artisthub.com'];
    if (!adminEmails.includes(auth.currentUser.email)) return;

    const crawler = new ImageCrawler();
    const crawlerUI = crawler.createCrawlerUI();

    // Add crawler UI to the page
    const targetContainer = document.getElementById('uploadControls');
    if (targetContainer) {
        targetContainer.appendChild(crawlerUI);
    }
}

// Initialize crawler when auth state changes
auth.onAuthStateChanged(initImageCrawler);

export { ImageCrawler, initImageCrawler };
