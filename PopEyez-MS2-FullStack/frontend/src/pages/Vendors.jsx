import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

const requestFormInitial = { vendorId: '', items: '', deliveryDate: '', eventLocation: '', message: '' };

export default function Vendors({ selectedEventId, setNotice }) {
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(requestFormInitial);

  function load() {
    api.get(`/vendors${toQuery({ search })}`).then(setVendors).catch((error) => setNotice(error.message));
    api.get(`/sourcing-requests?eventId=${selectedEventId}`).then(setRequests).catch((error) => setNotice(error.message));
    api.get(`/invoices?eventId=${selectedEventId}`).then(setInvoices).catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId, search]);

  async function createRequest(event) {
    event.preventDefault();
    try {
      await api.post('/sourcing-requests', { ...form, eventId: selectedEventId });
      setNotice('Sourcing request sent to vendor.');
      setForm(requestFormInitial);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateInvoice(id, status) {
    try {
      await api.patch(`/invoices/${id}`, { status });
      setNotice('Invoice status updated.');
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
            <h3>Vendor search and sourcing requests</h3>
            <p>View vendor details, filter vendors, and send sourcing requests.</p>
          </div>
          <input placeholder="Search vendors or supplies" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <form className="inline-form" onSubmit={createRequest}>
          <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
            <option value="">Select vendor</option>
            {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
          </select>
          <input placeholder="Requested items / quantities" value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} />
          <input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
          <input placeholder="Event location" value={form.eventLocation} onChange={(e) => setForm({ ...form, eventLocation: e.target.value })} />
          <button>Submit request</button>
        </form>

        <DataTable
          columns={[
            { key: 'name', label: 'Vendor' },
            { key: 'suppliesOffered', label: 'Supplies', render: (row) => row.suppliesOffered.join(', ') },
            { key: 'mainLocation', label: 'Location' },
            { key: 'pricingList', label: 'Pricing list' }
          ]}
          rows={vendors}
        />
      </section>

      <section className="panel two-column">
        <div>
          <h3>Delivery statuses</h3>
          <DataTable
            columns={[
              { key: 'id', label: 'Request' },
              { key: 'vendorId', label: 'Vendor' },
              { key: 'items', label: 'Items' },
              { key: 'status', label: 'Request', render: (row) => <StatusPill value={row.status} /> },
              { key: 'deliveryStatus', label: 'Delivery', render: (row) => <StatusPill value={row.deliveryStatus} /> }
            ]}
            rows={requests}
          />
        </div>
        <div>
          <h3>Invoices</h3>
          <DataTable
            columns={[
              { key: 'id', label: 'Invoice' },
              { key: 'vendorId', label: 'Vendor' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
              { key: 'action', label: 'Action', render: (row) => <button className="small" onClick={() => updateInvoice(row.id, 'Approved')}>Approve</button> }
            ]}
            rows={invoices}
          />
        </div>
      </section>
    </div>
  );
}
