import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

export default function Guests({ selectedEventId, setNotice, role }) {
  const [guests, setGuests] = useState([]);
  const [filters, setFilters] = useState({ rsvpStatus: '', dietaryPreference: '', search: '' });
  const [newGuest, setNewGuest] = useState({ name: '', email: '', dietaryPreference: '' });

  function load() {
    api.get(`/guests${toQuery({ eventId: selectedEventId, ...filters })}`).then(setGuests).catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId, filters]);

  async function addGuest(event) {
    event.preventDefault();
    try {
      await api.post('/guests', { ...newGuest, eventId: selectedEventId });
      setNotice('Guest added to event list.');
      setNewGuest({ name: '', email: '', dietaryPreference: '' });
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function sendInvitations() {
    try {
      const result = await api.post('/invitations', { eventId: selectedEventId });
      setNotice(result.message);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function checkIn(id) {
    try {
      await api.patch(`/guests/${id}/checkin`, { checkedIn: true });
      setNotice('Guest checked in.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h3>Guest list, invitations, RSVPs and dietary preferences</h3>
          <p>Filter guests by event, RSVP status, dietary preference, or name.</p>
        </div>
        <button onClick={sendInvitations}>Send digital invitations</button>
      </div>

      <div className="inline-form">
        <input placeholder="Search guest" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select value={filters.rsvpStatus} onChange={(e) => setFilters({ ...filters, rsvpStatus: e.target.value })}>
          <option value="">All RSVP statuses</option>
          <option>Pending</option>
          <option>Attending</option>
          <option>Maybe</option>
          <option>Not Attending</option>
        </select>
        <input placeholder="Dietary preference" value={filters.dietaryPreference} onChange={(e) => setFilters({ ...filters, dietaryPreference: e.target.value })} />
      </div>

      {role === 'organizer' && (
        <form className="inline-form" onSubmit={addGuest}>
          <input placeholder="Guest name" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} />
          <input placeholder="Guest email" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
          <input placeholder="Dietary preference" value={newGuest.dietaryPreference} onChange={(e) => setNewGuest({ ...newGuest, dietaryPreference: e.target.value })} />
          <button>Add guest</button>
        </form>
      )}

      <DataTable
        columns={[
          { key: 'name', label: 'Guest' },
          { key: 'email', label: 'Email' },
          { key: 'rsvpStatus', label: 'RSVP', render: (row) => <StatusPill value={row.rsvpStatus} /> },
          { key: 'dietaryPreference', label: 'Dietary preference' },
          { key: 'invitationSent', label: 'Invitation', render: (row) => row.invitationSent ? 'Sent' : 'Not sent' },
          { key: 'checkedIn', label: 'Check-in', render: (row) => row.checkedIn ? 'Arrived' : 'Not arrived' },
          { key: 'action', label: 'Action', render: (row) => <button className="small" onClick={() => checkIn(row.id)}>Check in</button> }
        ]}
        rows={guests}
      />
    </section>
  );
}
