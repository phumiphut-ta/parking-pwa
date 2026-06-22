// State
let map;
let userMarker;
let parkMarker;
let watchId;
let currentPos = null;
let timerIntervalId = null;

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
    parkCoords: document.getElementById('park-coords'),
    parkNote: document.getElementById('park-note'),
    btnRequestGps: document.getElementById('btn-request-gps'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    elapsedTime: document.getElementById('elapsed-time'),
    parkLimitSelect: document.getElementById('park-limit-select'),
    countdownArea: document.getElementById('countdown-area'),
    countdownProgressBar: document.getElementById('countdown-progress-bar'),
    countdownTime: document.getElementById('countdown-time'),
    btnShare: document.getElementById('btn-share'),
    toast: document.getElementById('toast')
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

            // First fix: pan or fit bounds showing user and parked car
            if (!window.hasCenteredOnce) {
                fitMapBounds();
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
        fitMapBounds();
    });

    els.btnFullscreen.addEventListener('click', () => {
        const mapCard = document.querySelector('.map-card');
        const isFullscreen = mapCard.classList.toggle('fullscreen');
        const icon = els.btnFullscreen.querySelector('i');
        
        if (isFullscreen) {
            icon.className = 'fa-solid fa-compress';
            els.btnFullscreen.setAttribute('aria-label', 'หุบแผนที่');
        } else {
            icon.className = 'fa-solid fa-expand';
            els.btnFullscreen.setAttribute('aria-label', 'เต็มจอ');
        }
        
        // Invalidate Leaflet map size after CSS transition/layout update
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
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

    // Limit select change listener
    els.parkLimitSelect.addEventListener('change', (e) => {
        const currentData = getParkingData();
        if (currentData) {
            currentData.limitMinutes = parseInt(e.target.value) || 0;
            localStorage.setItem(PARKING_KEY, JSON.stringify(currentData));
            updateTimerDisplay(currentData);
        }
    });

    // Share button listener
    els.btnShare.addEventListener('click', () => {
        shareParking();
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

    fitMapBounds();
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
        const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        els.parkTime.textContent = `${dateStr} เวลา ${timeStr}`;

        if (data.lat && data.lng) {
            els.parkCoords.textContent = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
            els.btnNavigate.style.display = 'flex';
        } else {
            els.parkCoords.textContent = 'ระบุตำแหน่งไม่ได้ (บันทึกแค่โน้ต)';
            els.btnNavigate.style.display = 'none';
        }

        // Restore Note
        els.parkNote.value = data.note || '';

        // Restore Limit Selector
        els.parkLimitSelect.value = data.limitMinutes || 0;

        // Start/Reset Timer
        stopTimer();
        timerIntervalId = setInterval(() => {
            const currentData = getParkingData();
            if (currentData) {
                updateTimerDisplay(currentData);
            } else {
                stopTimer();
            }
        }, 1000);
        updateTimerDisplay(data);

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
        stopTimer();
    }
}

function fitMapBounds() {
    if (!map) return;
    const data = getParkingData();
    const points = [];
    
    if (currentPos) {
        points.push([currentPos.lat, currentPos.lng]);
    }
    if (data && data.lat && data.lng) {
        points.push([data.lat, data.lng]);
    }
    
    if (points.length === 2) {
        map.fitBounds(points, { padding: [50, 50], maxZoom: 18 });
    } else if (points.length === 1) {
        map.flyTo(points[0], 17);
    }
}

function stopTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function updateTimerDisplay(data) {
    if (!data || !data.timestamp) return;
    
    const startTime = new Date(data.timestamp).getTime();
    const now = Date.now();
    const elapsedMs = now - startTime;
    
    // 1. Update Elapsed Time (hh:mm:ss)
    const elapsedSec = Math.floor(elapsedMs / 1000) % 60;
    const elapsedMin = Math.floor(elapsedMs / (1000 * 60)) % 60;
    const elapsedHour = Math.floor(elapsedMs / (1000 * 60 * 60));
    
    const formatNum = (num) => String(num).padStart(2, '0');
    els.elapsedTime.textContent = `${formatNum(elapsedHour)}:${formatNum(elapsedMin)}:${formatNum(elapsedSec)}`;
    
    // 2. Update Countdown Expiry if limitMinutes is set
    const limitMin = data.limitMinutes || 0;
    if (limitMin > 0) {
        els.countdownArea.style.display = 'block';
        
        const limitMs = limitMin * 60 * 1000;
        const remainingMs = limitMs - elapsedMs;
        
        // Calculate percentage remaining
        const remainingPercent = Math.max(0, Math.min(100, (remainingMs / limitMs) * 100));
        
        // Update Progress Bar
        els.countdownProgressBar.style.width = `${remainingPercent}%`;
        
        // Reset warning classes
        els.countdownProgressBar.className = 'countdown-progress-bar';
        els.countdownTime.className = 'countdown-time';
        
        const remainingMinTotal = remainingMs / (1000 * 60);
        
        if (remainingMs <= 0) {
            // Expired state
            els.countdownProgressBar.classList.add('danger');
            els.countdownTime.classList.add('danger');
            els.countdownProgressBar.style.width = '0%';
            
            const overMs = Math.abs(remainingMs);
            const overMin = Math.floor(overMs / (1000 * 60)) % 60;
            const overHour = Math.floor(overMs / (1000 * 60 * 60));
            
            document.getElementById('countdown-label').textContent = 'จอดเกินกำหนดมาแล้ว';
            
            if (overHour > 0) {
                els.countdownTime.textContent = `${overHour} ชม. ${overMin} นาที`;
            } else {
                const overSec = Math.floor(overMs / 1000) % 60;
                els.countdownTime.textContent = `${overMin}:${formatNum(overSec)}`;
            }
        } else {
            // Active countdown
            document.getElementById('countdown-label').textContent = 'เหลือเวลาอีก';
            
            const remSec = Math.floor(remainingMs / 1000) % 60;
            const remMin = Math.floor(remainingMs / (1000 * 60)) % 60;
            const remHour = Math.floor(remainingMs / (1000 * 60 * 60));
            
            if (remHour > 0) {
                els.countdownTime.textContent = `${remHour} ชม. ${remMin} นาที`;
            } else {
                els.countdownTime.textContent = `${remMin}:${formatNum(remSec)}`;
            }
            
            if (remainingMinTotal <= 15) {
                // Less than 15 mins left -> Warning (Orange)
                els.countdownProgressBar.classList.add('warning');
                els.countdownTime.classList.add('warning');
            }
        }
    } else {
        els.countdownArea.style.display = 'none';
    }
}

function shareParking() {
    const data = getParkingData();
    if (!data) return;
    
    let shareText = '🚗 พิกัดที่จอดรถของฉัน\n';
    if (data.note) {
        shareText += `📝 บันทึกช่วยจำ: ${data.note}\n`;
    }
    if (data.timestamp) {
        const date = new Date(data.timestamp);
        const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        shareText += `⏰ เวลาจอด: ${dateStr} เวลา ${timeStr}\n`;
    }
    
    let shareUrl = '';
    if (data.lat && data.lng) {
        shareUrl = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
    }
    
    const fullShareText = `${shareText}${shareUrl ? `📍 ลิงก์แผนที่: ${shareUrl}` : ''}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'พิกัดที่จอดรถของฉัน',
            text: shareText,
            url: shareUrl || undefined
        }).catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback to Clipboard Copy
        navigator.clipboard.writeText(fullShareText)
            .then(() => {
                showToast();
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                alert('แชร์ไม่สำเร็จ และคัดลอกพิกัดไม่ได้');
            });
    }
}

function showToast() {
    if (els.toast) {
        els.toast.classList.add('show');
        setTimeout(() => {
            els.toast.classList.remove('show');
        }, 2500);
    }
}
