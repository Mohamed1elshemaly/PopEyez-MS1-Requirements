import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

export default function Venues({ selectedEventId, setNotice }) {
  const [venues, setVenues] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ city: 'Cairo', availableDate: '', minCapacity: '' });

  function load() {
    api.get(`/venues${toQuery(filters)}`).then(setVenues).catch((error) => setNotice(error.message));
    api.get('/booking-requests').then(setRequests).catch((error) => setNotice(error.message));
  }

  useEffect(load, [filters]);

  async function apply(venue) {
    try {
      await api.post('/booking-requests', {
        eventId: selectedEventId,
        venueId: venue.id,
        date: filters.availableDate || venue.availableDates[0],
        specialRequirements: 'Setup access and electricity for café equipment.'
      });
      setNotice(`Booking application submitted for ${venue.name}.`);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Search and shortlist venues</h3>
            <p>Filter available venue listings by city, date, and capacity, then submit venue applications.</p>
          </div>
        </div>
        <div className="inline-form">
          <input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          <input type="date" value={filters.availableDate} onChange={(e) => setFilters({ ...filters, availableDate: e.target.value })} />
          <input type="number" placeholder="Minimum capacity" value={filters.minCapacity} onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })} />
          <button type="button" onClick={() => setFilters({ city: '', availableDate: '', minCapacity: '' })}>Clear filters</button>
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Venue' },
            { key: 'location', label: 'Location' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'pricing', label: 'Price', render: (row) => `${row.pricing} EGP` },
            { key: 'availableDates', label: 'Available dates', render: (row) => row.availableDates.join(', ') },
            { key: 'apply', label: 'Action', render: (row) => <button className="small" onClick={() => apply(row)}>Apply</button> }
          ]}
          rows={venues}
        />
      </section>

      <section className="panel">
        <h3>Booking request status</h3>
        <DataTable
          columns={[
            { key: 'id', label: 'Request' },
            { key: 'eventId', label: 'Event' },
            { key: 'venueId', label: 'Venue' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
            { key: 'counterProposal', label: 'Message / counter-proposal' }
          ]}
          rows={requests}
        />
      </section>
    </div>
  );
}
