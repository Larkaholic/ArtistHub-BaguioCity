import { db } from './firebase-config.js';
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentImageUrl = ''; // To store the uploaded image URL

        // DOM elements
        const yearsPanel = document.getElementById('vtlYearsPanel');
        const backgroundElement = document.getElementById('vtlBackground');
        const titleElement = document.getElementById('vtlTitle');
        const detailsElement = document.getElementById('vtlDetails');
        const yearInput = document.getElementById('year');
        const eventInput = document.getElementById('event');
        const historyImageBtn = document.getElementById('historyImage');
        const addEventBtn = document.getElementById('add-event');

        // Initialize Cloudinary Upload Widget
        const myWidget = cloudinary.createUploadWidget(
            {
                cloudName: 'dxeyr4pvf',
                uploadPreset: 'Hisrtory',
                maxFiles: 1,
                sources: ['local', 'camera'],
                folder: 'timeline',
                resourceType: 'image'
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    currentImageUrl = result.info.secure_url;
                    alert('Image uploaded successfully!');
                }
                if (error) {
                    console.error('Upload error:', error);
                    alert('Error uploading image');
                }
            }
        );

        // Handle image upload
        historyImageBtn.addEventListener('click', () => {
            myWidget.open();
        });

        // Handle adding new event
        addEventBtn.addEventListener('click', async () => {
            const year = yearInput.value.trim();
            const event = eventInput.value.trim();
            
            if (!year || !event || !currentImageUrl) {
                alert('Please fill all fields and upload an image');
                return;
            }

            try {
                // Add to Firebase
                await db.collection('timeline').add({
                    year: parseInt(year),
                    title: event,
                    details: event,
                    imageUrl: currentImageUrl
                });

                // Clear inputs
                yearInput.value = '';
                eventInput.value = '';
                currentImageUrl = '';
                
                // Refresh timeline
                await initializeTimeline();
                alert('Event added successfully!');
            } catch (error) {
                console.error('Error adding event:', error);
                alert('Error adding event');
            }
        });

        function updateTimelineContent(data) {
            // Update active button
            document.querySelectorAll('.vtl-year-button').forEach(btn => {
                btn.classList.remove('vtl-year-button--active');
                if (btn.textContent == data.year) {
                    btn.classList.add('vtl-year-button--active');
                }
            });

            // Update content with fade effect
            titleElement.style.opacity = 0;
            detailsElement.style.opacity = 0;
            backgroundElement.style.opacity = 0;

            setTimeout(() => {
                titleElement.textContent = data.title;
                detailsElement.textContent = data.details;
                backgroundElement.style.backgroundImage = `url(${data.imageUrl})`;
                
                titleElement.style.opacity = 1;
                detailsElement.style.opacity = 1;
                backgroundElement.style.opacity = 0.3;
            }, 300);
        }

        async function fetchTimelineData() {
            try {
                const snapshot = await db.collection('timeline')
                    .orderBy('year', 'desc')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error fetching timeline data:', error);
                return [];
            }
        }

        async function initializeTimeline() {
            try {
                const data = await fetchTimelineData();
                
                // Clear existing buttons
                yearsPanel.innerHTML = '';
                
                // Create new buttons
                data.forEach(item => {
                    const button = document.createElement('button');
                    button.className = 'vtl-year-button';
                    button.textContent = item.year;
                    button.onclick = () => updateTimelineContent(item);
                    yearsPanel.appendChild(button);
                });

                // Initialize with first item if exists
                if (data.length > 0) {
                    updateTimelineContent(data[0]);
                    document.querySelector('.vtl-year-button').classList.add('vtl-year-button--active');
                }
            } catch (error) {
                console.error('Error initializing timeline:', error);
            }
        }

        // Initial load
        initializeTimeline();