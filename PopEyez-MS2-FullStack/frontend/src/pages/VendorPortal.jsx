import { useEffect, useState } from 'react';
import { api } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

const demoVendorId = 'VND-001';

export default function VendorPortal({ setNotice }) {
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState({ eventId: 'EVT-001', amount: '', items: '', attachments: [] });

  function load() {
    api.get(`/sourcing-requests?vendorId=${demoVendorId}`).then(setRequests).catch((error) => setNotice(error.message));
    api.get(`/invoices?vendorId=${demoVendorId}`).then(setInvoices).catch((error) => setNotice(error.message));
  }

  useEffect(load, []);

  async function updateRequest(id, changes) {
    try {
      await api.patch(`/sourcing-requests/${id}`, changes);
      setNotice('Sourcing request updated.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function submitInvoice(event) {
    event.preventDefault();
    try {
      await api.post('/invoices', { ...invoiceForm, vendorId: demoVendorId, amount: Number(invoiceForm.amount) });
      setNotice('Invoice submitted to organizer.');
      setInvoiceForm({ eventId: 'EVT-001', amount: '', items: '', attachments: [] });
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <h3>Incoming sourcing requests</h3>
        <DataTable
          columns={[
            { key: 'eventId', label: 'Event' },
            { key: 'items', label: 'Requested items' },
            { key: 'deliveryDate', label: 'Delivery date' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
            { key: 'deliveryStatus', label: 'Delivery', render: (row) => <StatusPill value={row.deliveryStatus} /> },
            {
              key: 'actions', label: 'Actions', render: (row) => (
                <div className="button-row">
                  <button className="small" onClick={() => updateRequest(row.id, { status: 'Accepted' })}>Accept</button>
                  <button className="small" onClick={() => updateRequest(row.id, { status: 'Declined' })}>Decline</button>
                  <button className="small" onClick={() => updateRequest(row.id, { deliveryStatus: 'Out for Delivery' })}>Out</button>
                  <button className="small" onClick={() => updateRequest(row.id, { deliveryStatus: 'Delivered' })}>Delivered</button>
                </div>
              )
            }
          ]}
          rows={requests}
        />
      </section>

      <section className="panel">
        <h3>Submit and track invoices</h3>
        <form className="inline-form" onSubmit={submitInvoice}>
          <input placeholder="Event ID" value={invoiceForm.eventId} onChange={(e) => setInvoiceForm({ ...invoiceForm, eventId: e.target.value })} />
          <input type="number" placeholder="Amount" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
          <input placeholder="Itemized breakdown" value={invoiceForm.items} onChange={(e) => setInvoiceForm({ ...invoiceForm, items: e.target.value })} />
          <button>Submit invoice</button>
        </form>
        <DataTable
          columns={[
            { key: 'id', label: 'Invoice' },
            { key: 'eventId', label: 'Event' },
            { key: 'amount', label: 'Amount' },
            { key: 'items', label: 'Items' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
          ]}
          rows={invoices}
        />
      </section>
    </div>
  );
}
