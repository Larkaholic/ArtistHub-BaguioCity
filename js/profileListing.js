const q = query(
    collection(db, "users"),
    where("userType", "==", "artist"),
    where("status", "==", "approved")
);


onSnapshot(q, (querySnapshot) => {
    const artistsContainer = document.getElementById('artists-container');
    artistsContainer.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const artistData = doc.data();

    });
});