import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Add a notification to the database
export async function addNotification(userId, type, title, message, data = {}) {
    try {
        const notificationData = {
            userId: userId,
            type: type,
            title: title,
            message: message,
            data: data,
            read: false,
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        console.log('Notification added with ID:', docRef.id);
        
        // Update notification badge count
        updateNotificationBadge(userId);
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding notification:', error);
        throw error;
    }
}

// Get notifications for a user
export async function getUserNotifications(userId) {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true,
            readAt: serverTimestamp()
        });
        
        console.log('Notification marked as read:', notificationId);
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Delete notification
export async function deleteNotification(notificationId) {
    try {
        await deleteDoc(doc(db, 'notifications', notificationId));
        console.log('Notification deleted:', notificationId);
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Update notification badge count
export async function updateNotificationBadge(userId) {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        const unreadCount = querySnapshot.size;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        return unreadCount;
    } catch (error) {
        console.error('Error updating notification badge:', error);
        return 0;
    }
}

// Listen for real-time notification updates
export function setupNotificationListener(userId) {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const unreadCount = querySnapshot.size;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    });
}

// Load and display notifications in the modal
export async function loadNotificationsModal(userId) {
    try {
        const notifications = await getUserNotifications(userId);
        const notificationsList = document.getElementById('notificationsList');
        
        if (!notificationsList) {
            console.error('Notifications list element not found');
            return;
        }
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="text-center text-gray-500 py-4">No new notifications</div>';
            return;
        }
        
        let notificationsHTML = '';
        
        notifications.forEach(notification => {
            const timestamp = notification.createdAt?.toDate ? 
                new Date(notification.createdAt.toDate()).toLocaleDateString() : 
                'Unknown date';
            
            const readClass = notification.read ? 'opacity-60' : '';
            
            notificationsHTML += `
                <div class="border-b border-gray-200 p-4 ${readClass}" data-notification-id="${notification.id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${notification.title}</h4>
                            <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                            <p class="text-xs text-gray-400 mt-2">${timestamp}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${!notification.read ? `
                                <button onclick="markAsRead('${notification.id}')" 
                                        class="text-xs text-blue-600 hover:text-blue-800">
                                    Mark as read
                                </button>
                            ` : ''}
                            <button onclick="deleteNotificationItem('${notification.id}')" 
                                    class="text-xs text-red-600 hover:text-red-800">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        notificationsList.innerHTML = notificationsHTML;
        
    } catch (error) {
        console.error('Error loading notifications modal:', error);
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            notificationsList.innerHTML = '<div class="text-center text-red-500 py-4">Error loading notifications</div>';
        }
    }
}

// Handle marking notification as read from UI
window.markAsRead = async function(notificationId) {
    await markNotificationAsRead(notificationId);
    
    // Update UI
    const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
        notificationElement.classList.add('opacity-60');
        const markAsReadBtn = notificationElement.querySelector('button[onclick*="markAsRead"]');
        if (markAsReadBtn) {
            markAsReadBtn.remove();
        }
    }
    
    // Update badge count
    const { auth } = await import('./firebase-config.js');
    if (auth.currentUser) {
        updateNotificationBadge(auth.currentUser.uid);
    }
};

// Handle deleting notification from UI
window.deleteNotificationItem = async function(notificationId) {
    await deleteNotification(notificationId);
    
    // Remove from UI
    const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
        notificationElement.remove();
    }
    
    // Update badge count
    const { auth } = await import('./firebase-config.js');
    if (auth.currentUser) {
        updateNotificationBadge(auth.currentUser.uid);
    }
    
    // Check if notifications list is empty
    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList && notificationsList.children.length === 0) {
        notificationsList.innerHTML = '<div class="text-center text-gray-500 py-4">No new notifications</div>';
    }
};

// Initialize notifications system
export function initNotifications() {
    // Import auth dynamically to avoid circular dependencies
    import('./firebase-config.js').then(({ auth }) => {
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    // Setup real-time listener for notifications
                    setupNotificationListener(user.uid);
                    
                    // Update badge count on initial load
                    updateNotificationBadge(user.uid);
                    
                    // Check for approval notifications and show modal if needed
                    checkForApprovalNotifications(user.uid);
                } else {
                    // Hide badge when user is logged out
                    const badge = document.getElementById('notificationBadge');
                    if (badge) {
                        badge.classList.add('hidden');
                    }
                }
            });
        }
    }).catch(error => {
        console.error('Error initializing notifications:', error);
    });
}

// Check for approval notifications and show modal
async function checkForApprovalNotifications(userId) {
    try {
        const notifications = await getUserNotifications(userId);
        const approvalNotification = notifications.find(n => 
            n.type === 'artist_approved' && !n.read
        );
        
        if (approvalNotification) {
            // Show the approval modal
            showArtistApprovalModal();
            
            // Mark the notification as read
            await markNotificationAsRead(approvalNotification.id);
        }
    } catch (error) {
        console.error('Error checking for approval notifications:', error);
    }
}

// Show artist approval modal
function showArtistApprovalModal() {
    const modal = document.getElementById('artistApprovalModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Close artist approval modal
window.closeArtistApprovalModal = function() {
    const modal = document.getElementById('artistApprovalModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// Navigate to edit profile
window.navigateToEditProfile = function() {
    
    // Navigate to edit profile page
    window.location.href = `/profile/edit-profile.html`;
    
    // Close the modal
    closeArtistApprovalModal();
};

// Override the openNotificationsModal function to load notifications
window.openNotificationsModal = async function() {
    const { auth } = await import('./firebase-config.js');
    
    if (auth.currentUser) {
        await loadNotificationsModal(auth.currentUser.uid);
    }
    
    document.getElementById('notificationsModal').classList.remove('hidden');
};
