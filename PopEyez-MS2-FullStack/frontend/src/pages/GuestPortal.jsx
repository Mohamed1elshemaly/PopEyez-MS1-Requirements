import { useEffect, useState } from 'react';
import { api } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

const demoGuestId = 'GST-001';

export default function GuestPortal({ selectedEventId, setNotice }) {
  const [guest, setGuest] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ overall: 5, food: 5, venue: 5, organization: 5, comments: '' });

  function load() {
    Promise.all([api.get(`/guests?eventId=${selectedEventId}`), api.get('/events'), api.get(`/communications?eventId=${selectedEventId}`)])
      .then(([guests, events, messages]) => {
        setGuest(guests.find((item) => item.id === demoGuestId) || guests[0]);
        setEventDetails(events.find((item) => item.id === selectedEventId));
        setCommunications(messages);
      })
      .catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  async function updateRsvp(rsvpStatus) {
    try {
      await api.patch(`/guests/${guest.id}/rsvp`, { rsvpStatus, dietaryPreference: guest.dietaryPreference, specialRequirements: guest.specialRequirements });
      setNotice('RSVP submitted. Confirmation message generated.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    try {
      const result = await api.post('/feedback', { eventId: selectedEventId, guestId: guest.id, ...feedbackForm });
      setNotice(result.message);
      setFeedbackForm({ overall: 5, food: 5, venue: 5, organization: 5, comments: '' });
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!guest || !eventDetails) return <section className="panel">Loading invitation...</section>;

  return (
    <div className="page-grid">
      <section className="hero panel">
        <p className="eyebrow">Digital invitation.</p>
        <h3>{eventDetails.name}</h3>
        <p>{eventDetails.date} at {eventDetails.time} • Venue ID: {eventDetails.venueId}</p>
        <p>Dress code: {eventDetails.dressCode}</p>
        <p>Agenda: {eventDetails.agenda}</p>
        <div className="button-row">
          <button onClick={() => updateRsvp('Attending')}>Attending</button>
          <button onClick={() => updateRsvp('Maybe')}>Maybe</button>
          <button onClick={() => updateRsvp('Not Attending')}>Not attending</button>
        </div>
        <p>Current RSVP: <StatusPill value={guest.rsvpStatus} /> | QR code: <strong>{guest.qrCode}</strong></p>
      </section>

      <section className="panel two-column">
        <div>
          <h3>Day-of msgs</h3>
          <DataTable
            columns={[
              { key: 'message', label: 'Message' },
              { key: 'sentAt', label: 'Sent at' }
            ]}
            rows={communications}
          />
        </div>
        <div>
          <h3>Submit post-event feedback</h3>
          <form className="stack-form" onSubmit={submitFeedback}>
            {['overall', 'food', 'venue', 'organization'].map((field) => (
              <label key={field}>{field}
                <input type="number" min="1" max="5" value={feedbackForm[field]} onChange={(e) => setFeedbackForm({ ...feedbackForm, [field]: Number(e.target.value) })} />
              </label>
            ))}
            <textarea placeholder="Open comments" value={feedbackForm.comments} onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })} />
            <button>Submit feedbck</button>
          </form>
        </div>
      </section>
    </div>
  );
}
