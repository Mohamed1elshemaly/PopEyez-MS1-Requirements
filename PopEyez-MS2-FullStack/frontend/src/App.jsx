import { useEffect, useState } from 'react';
import { api } from './api.js';
import Dashboard from './pages/Dashboard.jsx';
import Profiles from './pages/Profiles.jsx';
import Venues from './pages/Venues.jsx';
import EventsTasks from './pages/EventsTasks.jsx';
import Budget from './pages/Budget.jsx';
import LayoutDesigner from './pages/LayoutDesigner.jsx';
import Staff from './pages/Staff.jsx';
import Vendors from './pages/Vendors.jsx';
import Guests from './pages/Guests.jsx';
import DayOf from './pages/DayOf.jsx';
import Reports from './pages/Reports.jsx';
import VendorPortal from './pages/VendorPortal.jsx';
import GuestPortal from './pages/GuestPortal.jsx';
import VenueOwnerPortal from './pages/VenueOwnerPortal.jsx';
import Login from './pages/Login.jsx';

const pages = [
  { id: 'dashboard', label: 'Organizer Dashboard', component: Dashboard, roles: ['organizer'] },
  { id: 'profiles', label: 'Accounts & Profiles', component: Profiles, roles: ['organizer'] },
  { id: 'venues', label: 'Venue Search & Booking', component: Venues, roles: ['organizer'] },
  { id: 'planning', label: 'Events, Workflow & Tasks', component: EventsTasks, roles: ['organizer', 'staff'] },
  { id: 'budget', label: 'Budget Management', component: Budget, roles: ['organizer'] },
  { id: 'layout', label: 'Venue Layout', component: LayoutDesigner, roles: ['organizer', 'staff'] },
  { id: 'staff', label: 'Team Members', component: Staff, roles: ['organizer', 'staff'] },
  { id: 'vendors', label: 'Vendor Coordination', component: Vendors, roles: ['organizer'] },
  { id: 'guests', label: 'Guest Management', component: Guests, roles: ['organizer', 'staff'] },
  { id: 'dayof', label: 'Day-Of Operations', component: DayOf, roles: ['organizer', 'staff'] },
  { id: 'reports', label: 'Reports & Feedback', component: Reports, roles: ['organizer'] },
  { id: 'vendorPortal', label: 'Vendor Portal', component: VendorPortal, roles: ['vendor'] },
  { id: 'guestPortal', label: 'Guest Portal', component: GuestPortal, roles: ['guest'] },
  { id: 'venueOwner', label: 'Venue Owner Portal', component: VenueOwnerPortal, roles: ['venueOwner'] }
];

const roleLabels = {
  organizer: 'Event Organizer',
  staff: 'Team Member / Staff',
  vendor: 'Vendor / Supplier',
  guest: 'Guest',
  venueOwner: 'Venue Owner'
};

export default function App() {
  const [role, setRole] = useState('organizer');
  const [activePage, setActivePage] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('EVT-001');
  const [notice, setNotice] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('popeyezUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const availablePages = pages.filter((page) => page.roles.includes(role));
  const currentPage = pages.find((page) => page.id === activePage) || availablePages[0];
  const CurrentComponent = currentPage.component;

  useEffect(() => {
    api.get('/events')
      .then((data) => {
        setEvents(data);
        if (!selectedEventId && data[0]) setSelectedEventId(data[0].id);
      })
      .catch((error) => setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!availablePages.some((page) => page.id === activePage)) {
      setActivePage(availablePages[0]?.id || 'dashboard');
    }
  }, [role]);

  async function handleLogin(credentials) {
    const result = await api.post('/auth/login', credentials);
    setCurrentUser(result.user);
    localStorage.setItem('popeyezUser', JSON.stringify(result.user));
    setRole(result.user.role);
    const defaultPage = pages.find((page) => page.roles.includes(result.user.role));
    setActivePage(defaultPage?.id || 'dashboard');
    setNotice(`Logged in as ${result.user.name}`);
  }

  function handleLogout() {
    localStorage.removeItem('popeyezUser');
    setCurrentUser(null);
    setRole('organizer');
    setActivePage('dashboard');
    setNotice('');
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} notice={notice} />;
  }

  const sharedProps = {
    events,
    setEvents,
    selectedEventId,
    setSelectedEventId,
    notice,
    setNotice,
    role,
    currentUser
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PE</div>
          <div>
            <h1>PopEyez</h1>
            <p>Pop-Up Café Event Platform</p>
          </div>
        </div>

        <div className="user-card">
          <span>Logged in as</span>
          <strong>{currentUser.name}</strong>
          <small>{roleLabels[currentUser.role]} • {currentUser.email}</small>
          <button className="small logout-button" onClick={handleLogout}>Logout</button>
        </div>

        <label className="field-label">Switch role for demo</label>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>

        <label className="field-label">Selected event</label>
        <select value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)}>
          {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
        </select>

        <nav>
          {availablePages.map((page) => (
            <button
              key={page.id}
              className={activePage === page.id ? 'nav-button active' : 'nav-button'}
              onClick={() => setActivePage(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Milestone 2 Full-Stack Application</p>
            <h2>{currentPage.label}</h2>
          </div>
          <div className="api-status">API: {api.baseUrl}</div>
        </header>

        {notice && (
          <div className="notice">
            <span>{notice}</span>
            <button onClick={() => setNotice('')}>Dismiss</button>
          </div>
        )}

        <CurrentComponent {...sharedProps} />
      </main>
    </div>
  );
}
