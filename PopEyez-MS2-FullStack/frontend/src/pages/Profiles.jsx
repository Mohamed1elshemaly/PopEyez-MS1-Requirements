import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

const emptyForm = { name: '', email: '', role: 'staff', speciality: '', phone: '' };

export default function Profiles({ setNotice }) {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(emptyForm);

  function load() {
    api.get(`/users${toQuery({ role: roleFilter })}`).then(setUsers).catch((error) => setNotice(error.message));
  }

  useEffect(load, [roleFilter]);

  async function createUser(event) {
    event.preventDefault();
    try {
      await api.post('/users', form);
      setNotice('Account created successfully.');
      setForm(emptyForm);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function deactivate(id) {
    try {
      await api.delete(`/users/${id}`);
      setNotice('Account deactivated.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h3>Account creation and customization</h3>
          <p>Create/update stakeholder accounts and deactivate them when needed.</p>
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All roles</option>
          <option value="organizer">Organizer</option>
          <option value="staff">Staff</option>
          <option value="vendor">Vendor</option>
          <option value="guest">Guest</option>
          <option value="venueOwner">Venue Owner</option>
        </select>
      </div>

      <form className="inline-form" onSubmit={createUser}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="staff">Staff</option>
          <option value="vendor">Vendor</option>
          <option value="guest">Guest</option>
          <option value="venueOwner">Venue Owner</option>
          <option value="organizer">Organizer</option>
        </select>
        <input placeholder="Speciality / company" value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} />
        <button>Create account</button>
      </form>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'speciality', label: 'Details', render: (row) => row.speciality || row.companyName || row.mainLocation || '-' },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          { key: 'actions', label: 'Action', render: (row) => <button className="small" onClick={() => deactivate(row.id)}>Deactivate</button> }
        ]}
        rows={users}
      />
    </section>
  );
}
