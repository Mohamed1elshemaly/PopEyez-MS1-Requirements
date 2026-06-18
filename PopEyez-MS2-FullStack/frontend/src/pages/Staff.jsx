import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

export default function Staff({ selectedEventId, setNotice }) {
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ employmentType: '', speciality: '' });

  function load() {
    api.get(`/staff${toQuery(filters)}`).then(setStaff).catch((error) => setNotice(error.message));
    api.get(`/tasks?eventId=${selectedEventId}`).then(setTasks).catch((error) => setNotice(error.message));
  }

  useEffect(load, [filters, selectedEventId]);

  async function assign(taskId, staffId) {
    try {
      await api.patch(`/tasks/${taskId}`, { assignedTo: staffId, status: 'In Progress' });
      setNotice('Task assigned to staff member.');
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
            <h3>Staff list and details</h3>
            <p>Filter by part-time/full-time and speciality.</p>
          </div>
          <div className="button-row">
            <select value={filters.employmentType} onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}>
              <option value="">Any type</option>
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
            </select>
            <input placeholder="Speciality" value={filters.speciality} onChange={(e) => setFilters({ ...filters, speciality: e.target.value })} />
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'age', label: 'Age' },
            { key: 'speciality', label: 'Speciality' },
            { key: 'employmentType', label: 'Type' },
            { key: 'email', label: 'Email' }
          ]}
          rows={staff}
        />
      </section>

      <section className="panel">
        <h3>Task assignment board</h3>
        <DataTable
          columns={[
            { key: 'title', label: 'Task' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
            { key: 'assignedTo', label: 'Assigned to', render: (row) => staff.find((member) => member.id === row.assignedTo)?.name || 'Unassigned' },
            {
              key: 'assign', label: 'Assign', render: (row) => (
                <select value={row.assignedTo || ''} onChange={(e) => assign(row.id, e.target.value)}>
                  <option value="">Select staff</option>
                  {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              )
            }
          ]}
          rows={tasks}
        />
      </section>
    </div>
  );
}
