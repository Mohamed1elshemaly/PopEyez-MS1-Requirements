# PopEyez – Milestone 2 Full-Stack Application

PopEyez is a pop-up café event management platform built for the Software Engineering Milestone 2 submission. The application implements the main user journeys for event organizers, team members/staff, vendors, guests, and venue owners.

## Technologies Used

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Local JSON database persisted in `backend/database/db.json`
- Dummy data: Generated realistic seed data in `backend/database/seed.json`
- Version control: GitHub repository

## Team Members and Contributions

Update this section with your real team information before submitting.

| Team Member | Student ID | Suggested Contribution |
|---|---|---|
| Member 1 | ID | Organizer dashboard, events and tasks |
| Member 2 | ID | Venue search and booking |
| Member 3 | ID | Vendor and invoice flows |
| Member 4 | ID | Guest management and day-of operations |
| Member 5 | ID | Venue owner portal, README, testing |

Each team member must make at least one meaningful GitHub commit before the deadline.

## Project Structure

```text
PopEyez-MS2-FullStack/
  frontend/
    src/
      components/
      pages/
      App.jsx
      api.js
      main.jsx
      styles.css
    package.json
  backend/
    database/
      seed.json
      db.json
    scripts/
      seed.js
    db.js
    server.js
    package.json
  database/
    schema.md
  docs/
    AI_CHATLOG.md
    ASSUMPTIONS.md
  README.md
```

## Implemented User Journeys

### Event Organizer

- Account creation and stakeholder deactivation
- Venue search, filtering, booking application submission, and booking status tracking
- Daily dashboard with event, guest, task, vendor, budget, and feedback summaries
- Upcoming event list and task workflow with filters and status updates
- Budget management including planned totals, planned decomposition, actual expenses, and variance calculation
- Digital venue layout designer with share and export actions
- Staff listing, staff filtering, task assignment, and task tracking
- Vendor search, sourcing request submission, delivery tracking, invoice review and approval
- Guest list, guest filtering, digital invitation sending, RSVP and dietary preference visibility
- Day-of operations dashboard, live guest communications, follow-up messages, guest check-in and vendor arrival tracking
- Post-event feedback review and exportable report JSON

### Team Members / Staff

- Staff role switcher access for demo login
- Assigned event/task list
- Task status updates
- Shared floor plan view
- Guest check-in support
- Vendor arrival marking
- Day-of dashboard visibility

### Vendors / Suppliers

- Vendor portal access
- Incoming sourcing request list
- Request accept/decline actions
- Delivery status updates
- Invoice creation and status tracking

### Guests

- Digital invitation view
- RSVP response: Attending, Maybe, Not Attending
- QR/name confirmation display for check-in
- Day-of messages display
- Post-event feedback form

### Venue Owners

- Venue owner portal access
- Venue listing creation with location, capacity, dimensions, amenities placeholder, pricing, photos/floor-plan placeholders, and availability dates
- Booking request approval/decline with counter-proposal message
- Confirmed booking overview
- Performance metrics: listings, requests, booking rate, and revenue


## Demo login accounts

The app now starts with a login page. Use password `demo123` for any demo account:

| User journey | Email |
|---|---|
| Event Organizer | organizer@popeyez.com |
| Team Member / Staff | staff.setup@popeyez.com |
| Vendor / Supplier | vendor.beans@example.com |
| Guest | mariam@example.com |
| Venue Owner | owner@downtownspaces.com |

The frontend sends the login request to `POST /api/auth/login`, and the backend validates the demo user against the seeded database.

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-github-repository-link>
cd PopEyez-MS2-FullStack
```

### 2. Install and run the backend

```bash
cd backend
npm install
npm run seed
npm start
```

The backend will run at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. Install and run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Environment Variables

The frontend uses this default API URL:

```text
http://localhost:5000/api
```

To change it, create `frontend/.env`:

```text
VITE_API_URL=http://localhost:5000/api
```

The backend port defaults to `5000`. To change it:

```bash
PORT=5050 npm start
```

## Database Setup and Dummy Data

The project uses a local JSON database for easy local testing.

- Seed data file: `backend/database/seed.json`
- Active database file: `backend/database/db.json`
- Seed script: `backend/scripts/seed.js`

To reset the database:

```bash
cd backend
npm run seed
```

The seed data includes:

- Users with organizer, staff, vendor, guest, and venue owner roles
- Events
- Venues and availability dates
- Booking requests
- Tasks and assignments
- Budgets with planned and actual expenses
- Layout elements
- Vendors and sourcing requests
- Invoices
- Guests, RSVPs, dietary preferences and QR codes
- Day-of communications
- Feedback and reports

## Main API Endpoints

```text
GET    /api/health
GET    /api/bootstrap
GET    /api/dashboard?eventId=EVT-001
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
GET    /api/events
POST   /api/events
GET    /api/venues
POST   /api/venues
PATCH  /api/venues/:id
DELETE /api/venues/:id
GET    /api/booking-requests
POST   /api/booking-requests
PATCH  /api/booking-requests/:id
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
GET    /api/staff
GET    /api/budgets/:eventId
PATCH  /api/budgets/:eventId
POST   /api/budgets/:eventId/planned-items
POST   /api/budgets/:eventId/actual-expenses
GET    /api/layouts/:eventId
PATCH  /api/layouts/:eventId
GET    /api/vendors
GET    /api/sourcing-requests
POST   /api/sourcing-requests
PATCH  /api/sourcing-requests/:id
GET    /api/invoices
POST   /api/invoices
PATCH  /api/invoices/:id
GET    /api/guests
POST   /api/guests
POST   /api/invitations
PATCH  /api/guests/:id/rsvp
PATCH  /api/guests/:id/checkin
GET    /api/communications
POST   /api/communications
GET    /api/feedback
POST   /api/feedback
GET    /api/reports/:eventId
GET    /api/reports/:eventId/export
GET    /api/venue-owner/overview
```

## Testing the Application Manually

1. Start backend and frontend.
2. Open the frontend in the browser.
3. Use the role switcher on the left sidebar to test different user journeys.
4. Use the selected event dropdown to test flows for different events.
5. Try these actions:
   - Create a staff/vendor/guest account.
   - Search for a venue and submit a booking application.
   - Create and complete a task.
   - Update the planned budget and add an actual expense.
   - Add and move venue layout elements, then export layout JSON.
   - Send invitations and day-of messages.
   - Check in a guest.
   - Approve an invoice.
   - Submit guest feedback.
   - Approve a booking request as a venue owner.

## Assumptions

See `docs/ASSUMPTIONS.md`.

## AI Usage

AI was used to help generate the initial project structure, code, README, assumptions, and sample data. The team must review, test, understand, and adapt the submitted code. Add the required AI chatlog link or file to the repository as requested by the project guidelines.

See `docs/AI_CHATLOG.md`.
