import { useEffect, useState } from 'react';
import { api } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusPill from '../components/StatusPill.jsx';

const listingInitial = { name: '', description: '', city: 'Cairo', location: '', capacity: '', dimensions: '', pricing: '', availableDates: '2026-07-20' };

export default function VenueOwnerPortal({ setNotice }) {
  const [overview, setOverview] = useState(null);
  const [listing, setListing] = useState(listingInitial);

  function load() {
    api.get('/venue-owner/overview').then(setOverview).catch((error) => setNotice(error.message));
  }

  useEffect(load, []);

  async function createListing(event) {
    event.preventDefault();
    try {
      await api.post('/venues', {
        ...listing,
        ownerId: 'USR-VENUE-01',
        capacity: Number(listing.capacity),
        dimensions: Number(listing.dimensions || 0),
        pricing: Number(listing.pricing),
        amenities: ['Wi-Fi'],
        availableDates: listing.availableDates.split(',').map((date) => date.trim()).filter(Boolean),
        photos: ['uploaded-photo-placeholder.jpg'],
        floorPlans: ['uploaded-floor-plan-placeholder.pdf']
      });
      setNotice('Venue listing created.');
      setListing(listingInitial);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function respondToRequest(id, status) {
    try {
      await api.patch(`/booking-requests/${id}`, { status, counterProposal: status === 'Approved' ? 'Approved by venue owner.' : 'Please choose another available date.' });
      setNotice(`Booking request ${status.toLowerCase()}.`);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!overview) return <section className="panel">Loading venue owner portal...</section>;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Listings" value={overview.metrics.totalListings} />
        <StatCard title="Booking requests" value={overview.metrics.totalRequests} />
        <StatCard title="Booking rate" value={`${overview.metrics.bookingRate}%`} />
        <StatCard title="Revenue" value={`${overview.metrics.revenue} EGP`} />
      </div>

      <section className="panel">
        <h3>Create and manage venue listings</h3>
        <form className="inline-form" onSubmit={createListing}>
          <input placeholder="Venue name" value={listing.name} onChange={(e) => setListing({ ...listing, name: e.target.value })} />
          <input placeholder="Description" value={listing.description} onChange={(e) => setListing({ ...listing, description: e.target.value })} />
          <input placeholder="City" value={listing.city} onChange={(e) => setListing({ ...listing, city: e.target.value })} />
          <input placeholder="Location" value={listing.location} onChange={(e) => setListing({ ...listing, location: e.target.value })} />
          <input type="number" placeholder="Capacity" value={listing.capacity} onChange={(e) => setListing({ ...listing, capacity: e.target.value })} />
          <input type="number" placeholder="m²" value={listing.dimensions} onChange={(e) => setListing({ ...listing, dimensions: e.target.value })} />
          <input type="number" placeholder="Pricing" value={listing.pricing} onChange={(e) => setListing({ ...listing, pricing: e.target.value })} />
          <input placeholder="Available dates, comma-separated" value={listing.availableDates} onChange={(e) => setListing({ ...listing, availableDates: e.target.value })} />
          <button>Create listing</button>
        </form>
        <DataTable
          columns={[
            { key: 'name', label: 'Listing' },
            { key: 'location', label: 'Location' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'pricing', label: 'Pricing' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
          ]}
          rows={overview.venues}
        />
      </section>

      <section className="panel two-column">
        <div>
          <h3>Booking request management</h3>
          <DataTable
            columns={[
              { key: 'id', label: 'Request' },
              { key: 'eventType', label: 'Type' },
              { key: 'date', label: 'Date' },
              { key: 'expectedAttendees', label: 'Guests' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
              {
                key: 'action', label: 'Action', render: (row) => (
                  <div className="button-row">
                    <button className="small" onClick={() => respondToRequest(row.id, 'Approved')}>Approve</button>
                    <button className="small" onClick={() => respondToRequest(row.id, 'Declined')}>Decline</button>
                  </div>
                )
              }
            ]}
            rows={overview.requests}
          />
        </div>
        <div>
          <h3>Confirmed bookings and reports</h3>
          <DataTable
            columns={[
              { key: 'id', label: 'Booking' },
              { key: 'venueId', label: 'Venue' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
            ]}
            rows={overview.confirmedBookings}
          />
        </div>
      </section>
    </div>
  );
}
