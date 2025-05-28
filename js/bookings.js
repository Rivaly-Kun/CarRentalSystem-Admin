// admin-bookings.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue, get,remove, child, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD29zvJ5gOvHRgk1qUWFzZJL8foY1sf8bk",
  authDomain: "primeroastweb.firebaseapp.com",
  databaseURL: "https://primeroastweb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "primeroastweb",
  storageBucket: "primeroastweb.appspot.com",
  messagingSenderId: "157736544071",
  appId: "1:157736544071:web:2713ba60d8edddc5344e62",
  measurementId: "G-MGMCTZCX2G"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const postDiv = document.getElementById("PostDiv");

const reservationsRef = ref(db, "reservations");
const usersRef = ref(db, "users");

onValue(reservationsRef, async (snapshot) => {
    postDiv.innerHTML = ""; // Clear existing rows

    if (!snapshot.exists()) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px;"><em>No bookings available.</em></td>
        `;
        postDiv.appendChild(tr);
        return;
    }
    
    const reservations = [];
    snapshot.forEach((childSnapshot) => {
        const resData = childSnapshot.val();
        const resId = childSnapshot.key;
        reservations.push({ ...resData, reservationId: resId });
    });

    for (const res of reservations) {
        const userId = res.userId;
        let fullName = "Unknown";
        let email = "N/A";
        let phone = "N/A";

        try {
            const userSnapshot = await get(child(usersRef, userId));
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                fullName = userData.fullName || "Unknown";
                email = userData.email || "N/A";
                phone = userData.phone || "N/A";
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

        const tr = document.createElement("tr");
        
        let actionButtons = `
       
      <button class="reject" onclick="rejectReservation('${res.reservationId}', '${res.CarId}')">

          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48"><g fill="none" stroke-linejoin="round" stroke-width="4"><path fill="#ff2f2f" stroke="#000" d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"/><path stroke="#fff" stroke-linecap="round" d="M29.6567 18.3432L18.343 29.6569"/><path stroke="#fff" stroke-linecap="round" d="M18.3433 18.3432L29.657 29.6569"/></g></svg> Cancel
        </button>
    `;
    
    if (res.status === "accepted") {
        actionButtons = `
            <button class="cancel" onclick="cancelReservation('${res.reservationId}')">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48"><g fill="none" stroke-linejoin="round" stroke-width="4"><path fill="#ff2f2f" stroke="#000" d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"/><path stroke="#fff" stroke-linecap="round" d="M29.6567 18.3432L18.343 29.6569"/><path stroke="#fff" stroke-linecap="round" d="M18.3433 18.3432L29.657 29.6569"/></g></svg> Cancel
            </button>
        `;
    }
    

        tr.innerHTML = `
            <td>${fullName}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${res.CarName || "Unknown Car"}</td>
            <td>${res.startTimeReadable || "N/A"}</td>
            <td>${res.endTimeReadable || "N/A"}</td>
            <td>${actionButtons}</td>
        `;

        postDiv.appendChild(tr);
    }
});

// Global function to accept the reservation
window.acceptReservation = function (reservationId) {
    const reservationRef = ref(db, 'reservations/' + reservationId);

    // Update reservation status to accepted
    update(reservationRef, {
        status: "accepted"
    }).then(() => {
        alert(`Reservation ${reservationId} accepted!`);
        // Refresh the data to update the buttons
        location.reload();
    }).catch((error) => {
        console.error("Error accepting reservation:", error);
    });
}

// Global function to reject the reservation
window.rejectReservation = function (reservationId, CarId) {
    const reservationRef = ref(db, 'reservations/' + reservationId);
    const CarRef = ref(db, 'Cars/' + CarId);
console.log(CarRef);
    // First update the Car status to available
    update(CarRef, {
        status: "Available"
    }).then(() => {
        // Then remove the reservation
        return remove(reservationRef);
    }).then(() => {
        alert(`Reservation ${reservationId} rejected and removed. Car is now available.`);
        // Refresh the data to update the UI
        location.reload();
    }).catch((error) => {
        console.error("Error rejecting reservation and updating Car:", error);
    });
};


// Global function to cancel the reservation
window.cancelReservation = function (reservationId) {
    const reservationRef = ref(db, 'reservations/' + reservationId);

    // Update reservation status to canceled
    update(reservationRef, {
        status: "canceled"
    }).then(() => {
        alert(`Reservation ${reservationId} canceled!`);
        // Refresh the data to remove the Cancel button
        location.reload();
    }).catch((error) => {
        console.error("Error canceling reservation:", error);
    });
}
