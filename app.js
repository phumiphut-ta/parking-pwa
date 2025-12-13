// State
let map;
let userMarker;
let parkMarker;
let watchId;
let currentPos = null;

// DOM Elements
const els = {
    statusText: document.getElementById('status-text'),
    statusIndicator: document.getElementById('status-indicator'),
    btnPark: document.getElementById('btn-park'),
    btnCenter: document.getElementById('btn-center'),
    btnNavigate: document.getElementById('btn-navigate'),
    btnClear: document.getElementById('btn-clear'),
    mainActionArea: document.getElementById('main-action-area'),
    parkingInfoCard: document.getElementById('parking-info-card'),
    parkTime: document.getElementById('park-time'),
    parkTime: document.getElementById('park-time'),
    parkCoords: document.getElementById('park-coords'),
    parkNote: document.getElementById('park-note'),
    btnRequestGps: document.getElementById('btn-request-gps')
};

// Config
const PARKING_KEY = 'parking_data';

// Init
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    startLocationWatch();
    loadParkingState();
    setupEvents();
    setupMobileGestures();
});

function setupMobileGestures() {
    // Prevent double-tap to zoom everywhere except map
    document.addEventListener('dblclick', (e) => {
        if (!e.target.closest('#map')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent pinch-zoom (iOS) everywhere except map
    document.addEventListener('gesturestart', (e) => {
        if (!e.target.closest('#map')) {
            e.preventDefault();
        }
    });
}

function initMap() {
    // Default to Bangkok view before loc found
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([13.7563, 100.5018], 10);

    // Modern styled map tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
}

function startLocationWatch() {
    if (!navigator.geolocation) {
        updateStatus('ไม่รองรับ GPS', 'error');
        return;
    }

    // Reset UI
    els.btnRequestGps.style.display = 'none';
    updateStatus('กำลังค้นหา...', 'searching');

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            currentPos = { lat: latitude, lng: longitude };

            updateUserMarker(latitude, longitude, accuracy);
            updateStatus('พร้อมใช้งาน', 'active');

            // First fix: pan to user
            if (!window.hasCenteredOnce) {
                map.setView([latitude, longitude], 16);
                window.hasCenteredOnce = true;
            }
        },
        (error) => {
            console.error(error);
            let msg = 'ค้นหา GPS ไม่เจอ';
            if (error.code === 1) msg = 'ไม่อนุญาต GPS';
            updateStatus(msg, 'error');
            els.btnRequestGps.style.display = 'flex';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function updateUserMarker(lat, lng, accuracy) {
    if (userMarker) {
        userMarker.setLatLng([lat, lng]);
        userMarker.setRadius(accuracy / 2); // Show accuracy circle
    } else {
        // Create custom blue dot marker using CircleMarker for better performance/look
        userMarker = L.circle([lat, lng], {
            color: '#4f46e5',
            fillColor: '#818cf8',
            fillOpacity: 0.4,
            radius: accuracy / 2
        }).addTo(map);

        // Add a center dot
        L.circleMarker([lat, lng], {
            radius: 6,
            color: '#fff',
            weight: 2,
            fillColor: '#4f46e5',
            fillOpacity: 1
        }).addTo(map).bindPopup("คุณอยู่ที่นี่");
    }
}

function updateStatus(text, type) {
    els.statusText.textContent = text;
    els.statusIndicator.className = `status ${type}`;
}

function setupEvents() {
    els.btnPark.addEventListener('click', () => {
        if (!currentPos) {
            // Fallback: Ask to save note only
            if (confirm('ไม่พบสัญญาณ GPS จะบันทึกเฉพาะโน้ตใช่ไหม?')) {
                saveParking(null, null);
            }
            return;
        }
        saveParking(currentPos.lat, currentPos.lng);
    });

    els.btnRequestGps.addEventListener('click', () => {
        startLocationWatch();
    });

    els.btnCenter.addEventListener('click', () => {
        if (currentPos) {
            map.flyTo([currentPos.lat, currentPos.lng], 17);
        }
    });

    els.btnClear.addEventListener('click', () => {
        if (confirm('ต้องการลบจุดจอดรถใช่ไหม?')) {
            clearParking();
        }
    });

    els.btnNavigate.addEventListener('click', () => {
        const data = getParkingData();
        if (data) {
            // Universal Link for Maps (Works on iOS/Android)
            // iOS: maps.apple.com -> Apple Maps
            // Android: maps.google.com -> Google Maps
            // Android: maps.google.com -> Google Maps
            if (data.lat && data.lng) {
                const url = `http://maps.google.com/?daddr=${data.lat},${data.lng}&dirflg=d`;
                window.location.href = url;
            } else {
                alert('ไม่มีข้อมูลพิกัดนำทาง');
            }
            // Backup for iOS specifically if needed: `http://maps.apple.com/?daddr=${data.lat},${data.lng}&dirflg=d`
        }
    });

    // Auto-save note
    els.parkNote.addEventListener('input', (e) => {
        const currentData = getParkingData();
        if (currentData) {
            currentData.note = e.target.value;
            localStorage.setItem(PARKING_KEY, JSON.stringify(currentData));
        }
    });
}

// Logic: Storage
function saveParking(lat, lng) {
    const data = {
        lat,
        lng,
        note: '', // Init empty note
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(PARKING_KEY, JSON.stringify(data));
    renderParkingState(data);

    if (lat && lng) {
        map.flyTo([lat, lng], 18);
    }
}

function getParkingData() {
    const raw = localStorage.getItem(PARKING_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearParking() {
    localStorage.removeItem(PARKING_KEY);
    if (parkMarker) {
        map.removeLayer(parkMarker);
        parkMarker = null;
    }
    renderParkingState(null);
}

function loadParkingState() {
    const data = getParkingData();
    renderParkingState(data);
}

function renderParkingState(data) {
    if (data) {
        // Parked State
        els.mainActionArea.style.display = 'none';
        els.parkingInfoCard.style.display = 'block';

        // Format Date
        const date = new Date(data.timestamp);
        els.parkTime.textContent = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

        if (data.lat && data.lng) {
            els.parkCoords.textContent = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
            els.btnNavigate.style.display = 'flex';
        } else {
            els.parkCoords.textContent = 'ระบุตำแหน่งไม่ได้ (บันทึกแค่โน้ต)';
            els.btnNavigate.style.display = 'none';
        }

        // Restore Note
        els.parkNote.value = data.note || '';

        // Map Marker
        if (parkMarker) map.removeLayer(parkMarker);

        if (data.lat && data.lng) {
            const carIcon = L.divIcon({
                html: '<i class="fa-solid fa-square-parking" style="font-size: 32px; color: #ef4444; background: white; border-radius: 8px;"></i>',
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            parkMarker = L.marker([data.lat, data.lng], { icon: carIcon })
                .addTo(map)
                .bindPopup("รถจอดตรงนี้")
                .openPopup();
        }

    } else {
        // Not Parked State
        els.mainActionArea.style.display = 'block';
        els.parkingInfoCard.style.display = 'none';
        if (parkMarker) map.removeLayer(parkMarker);
    }
}
