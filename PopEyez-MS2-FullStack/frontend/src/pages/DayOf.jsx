import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

export default function DayOf({ selectedEventId, setNotice }) {
  const [dashboard, setDashboard] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [message, setMessage] = useState('');

  function load() {
    api.get(`/dashboard?eventId=${selectedEventId}`).then(setDashboard).catch((error) => setNotice(error.message));
    api.get(`/guests?eventId=${selectedEventId}`).then(setGuests).catch((error) => setNotice(error.message));
    api.get(`/sourcing-requests?eventId=${selectedEventId}`).then(setVendors).catch((error) => setNotice(error.message));
    api.get(`/communications?eventId=${selectedEventId}`).then(setCommunications).catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  async function sendMessage(unseenOnly = false) {
    try {
      if (!message) return setNotice('Please write a message first.');
      await api.post('/communications', { eventId: selectedEventId, message, unseenOnly });
      setNotice(unseenOnly ? 'Follow-up message sent to unseen recipients.' : 'Day-of communication sent.');
      setMessage('');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function markVendorArrived(id) {
    try {
      await api.patch(`/sourcing-requests/${id}`, { deliveryStatus: 'Delivered' });
      setNotice('Vendor marked as arrived.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!dashboard) return <section className="panel">Loading day-of operations...</section>;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Total guests" value={dashboard.totals.totalGuests} />
        <StatCard title="Arrived guests" value={dashboard.totals.arrivedGuests} />
        <StatCard title="Vendor arrivals" value={dashboard.totals.vendorArrivals} />
        <StatCard title="Pending tasks" value={dashboard.totals.pendingTasks} />
      </div>

      <section className="panel">
        <h3>Live day-of communications</h3>
        <div className="inline-form">
          <input placeholder="Directions, schedule changes, welcome messages..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={() => sendMessage(false)}>Send to all guests</button>
          <button onClick={() => sendMessage(true)}>Follow up unseen</button>
        </div>
        <DataTable
          columns={[
            { key: 'message', label: 'Message' },
            { key: 'sentAt', label: 'Sent at' },
            { key: 'recipients', label: 'Seen', render: (row) => `${row.recipients.filter((item) => item.seen).length}/${row.recipients.length}` }
          ]}
          rows={communications}
        />
      </section>

      <section className="panel two-column">
        <div>
          <h3>Guest check-in</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Guest' },
              { key: 'rsvpStatus', label: 'RSVP', render: (row) => <StatusPill value={row.rsvpStatus} /> },
              { key: 'qrCode', label: 'QR / name confirmation' },
              { key: 'checkedIn', label: 'Status', render: (row) => row.checkedIn ? 'Arrived' : 'Not arrived' }
            ]}
            rows={guests}
          />
        </div>
        <div>
          <h3>Vendor arrival coordination</h3>
          <DataTable
            columns={[
              { key: 'vendorId', label: 'Vendor' },
              { key: 'items', label: 'Order' },
              { key: 'deliveryStatus', label: 'Delivery', render: (row) => <StatusPill value={row.deliveryStatus} /> },
              { key: 'action', label: 'Action', render: (row) => <button className="small" onClick={() => markVendorArrived(row.id)}>Mark arrived</button> }
            ]}
            rows={vendors}
          />
        </div>
      </section>
    </div>
  );
}
