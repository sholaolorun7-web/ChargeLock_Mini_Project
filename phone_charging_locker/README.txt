CHARGELOCK — PUBLIC PHONE CHARGING LOCKER MANAGEMENT SYSTEM

A compact, mobile-responsive frontend mini-project built with HTML, CSS and vanilla JavaScript.

HOW TO RUN
1. Extract the ZIP folder.
2. Open the phone_charging_locker folder.
3. Double-click index.html to open it in a modern browser.
   Recommended: use VS Code with the Live Server extension while developing.

FEATURES
- Admin dashboard with 8 sample lockers.
- Available, occupied and maintenance states.
- Start a charging session with customer name, phone number and device note.
- Live elapsed-time display for active sessions.
- End sessions and automatically release lockers.
- Search and filter lockers.
- Activity history and CSV export.
- LocalStorage persistence between browser visits.
- Responsive layout for mobile and desktop.

IMPORTANT PROJECT SCOPE
This is a frontend simulation for an academic mini-project. It does not control physical locker locks, charging ports or sensors. Real-world hardware control would require suitable electronics, a backend/API and security mechanisms.

DATA
The demo starts with eight available lockers. Data is stored in the browser's LocalStorage under the key chargelock_admin_v1.
To reset the demo, open browser developer tools > Application/Storage > Local Storage and remove that key, then refresh.
