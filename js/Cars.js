import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase config
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
const database = getDatabase(app);
const storage = getStorage(app);

// Add Car
// Add Car
document.getElementById('addCarBtn').addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Add Car',
        html: `
            <input id="CarName" class="swal2-input" placeholder="Car Name">
            <input id="location" class="swal2-input" placeholder="Location">
            <input id="rate" type="number" min="0" class="swal2-input" placeholder="Rate in ₱ (Pesos)">
            <select id="status" class="swal2-input">
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="In Use">In Use</option>
            </select>
            <label>Select 3 Images:</label>
            <input type="file" id="CarImages" class="swal2-file" multiple accept="image/*">
        `,
        focusConfirm: false,
        preConfirm: async () => {
            const name = document.getElementById('CarName').value;
            const location = document.getElementById('location').value;
            const status = document.getElementById('status').value;
            const rate = document.getElementById('rate').value;
            const files = document.getElementById('CarImages').files;

            if (!name || !location || !status || !rate || files.length !== 3) {
                Swal.showValidationMessage("Please fill all fields, set a rate, and upload exactly 3 images.");
                return false;
            }

            const imageURLs = [];
            for (let i = 0; i < 3; i++) {
                const file = files[i];
                const imageRef = sRef(storage, `Cars/${Date.now()}_${file.name}`);
                await uploadBytes(imageRef, file);
                const downloadURL = await getDownloadURL(imageRef);
                imageURLs.push(downloadURL);
            }

            return { name, location, status, rate, images: imageURLs };
        }
    });

    if (formValues) {
        const CarRef = push(ref(database, 'Cars'));
        await set(CarRef, {
            CarName: formValues.name,
            location: formValues.location,
            status: formValues.status,
            rate: parseFloat(formValues.rate),
            images: formValues.images
        });
        Swal.fire('Success', 'Car added with images and rate!', 'success');
    }
});

// Load Cars
function loadCars() {
    const CarsRef = ref(database, 'Cars');
    const tableBody = document.getElementById('AssistantDiv');

    onValue(CarsRef, (snapshot) => {
        tableBody.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const Car = childSnapshot.val();
            const CarId = childSnapshot.key;

            const row = document.createElement('tr');
            const imageBtn = `
                <button class="view-images-btn" data-images='${JSON.stringify(Car.images || [])}'>
                    View Images
                </button>
            `;

            row.innerHTML = `
                <td>${Car.CarName}</td>
                <td>${Car.location}</td>
                <td>${Car.status}</td>
                <td>₱${Car.rate ? parseFloat(Car.rate).toFixed(2) : '0.00'}</td>
                <td>${imageBtn}</td>
                <td>
                   <button class="edit-btn" data-id="${CarId}" style="cursor:pointer;">
                       ✏️ Edit
                   </button>
                   <button class="delete-btn" data-id="${CarId}" style="background:none;border:none;cursor:pointer;">
                       🗑️ Delete
                   </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // View images handler
        document.querySelectorAll('.view-images-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const images = JSON.parse(e.currentTarget.getAttribute('data-images'));
                const imageHTML = images.map(url => `<img src="${url}" style="max-width:100%; margin:5px; border-radius:10px;">`).join('');

                await Swal.fire({
                    title: 'Car Images',
                    html: `<div style="display:flex; flex-wrap:wrap; justify-content:center;">${imageHTML}</div>`,
                    width: '800px'
                });
            });
        });

        // Edit Car
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const CarId = e.currentTarget.getAttribute('data-id');
                const CarRef = ref(database, 'Cars/' + CarId);

                onValue(CarRef, async (snapshot) => {
                    const Car = snapshot.val();

                    if (Car) {
                        const { value: formValues } = await Swal.fire({
                            title: 'Edit Car Details',
                            html: `
                                <input id="CarName" class="swal2-input" value="${Car.CarName}" placeholder="Car Name">
                                <input id="location" class="swal2-input" value="${Car.location}" placeholder="Location">
                                <input id="rate" type="number" class="swal2-input" value="${Car.rate || 50}" placeholder="Rate in ₱">
                                <select id="status" class="swal2-input">
                                    <option value="Available" ${Car.status === 'Available' ? 'selected' : ''}>Available</option>
                                    <option value="Maintenance" ${Car.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                    <option value="In Use" ${Car.status === 'In Use' ? 'selected' : ''}>In Use</option>
                                </select>
                            `,
                            focusConfirm: false,
                            preConfirm: async () => {
                                const name = document.getElementById('CarName').value;
                                const location = document.getElementById('location').value;
                                const status = document.getElementById('status').value;
                                const rate = document.getElementById('rate').value;

                                if (!name || !location || !status || rate === '') {
                                    Swal.showValidationMessage("Please fill all fields.");
                                    return false;
                                }

                                return { name, location, status, rate };
                            }
                        });

                        if (formValues) {
                            await set(ref(database, 'Cars/' + CarId), {
                                CarName: formValues.name,
                                location: formValues.location,
                                status: formValues.status,
                                rate: parseFloat(formValues.rate),
                                images: Car.images
                            });

                            Swal.fire('Updated!', 'Car details have been updated.', 'success');
                        }
                    }
                }, { onlyOnce: true });
            });
        });

        // Delete Car
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const confirm = await Swal.fire({
                    title: 'Are you sure?',
                    text: "This will permanently delete the Car.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                });
                if (confirm.isConfirmed) {
                    await set(ref(database, 'Cars/' + id), null);
                    Swal.fire('Deleted!', 'Car has been removed.', 'success');
                }
            });
        });
    });
}

loadCars();
