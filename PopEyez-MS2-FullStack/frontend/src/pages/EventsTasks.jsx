import { useEffect, useState } from 'react';
import { api, toQuery } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

const newTask = { title: '', category: 'Operations', dueDate: '', assignedTo: '' };

export default function EventsTasks({ events, setEvents, selectedEventId, setNotice, role }) {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [taskForm, setTaskForm] = useState(newTask);

  function load() {
    api.get(`/events${toQuery({ date: dateFilter })}`).then(setEvents).catch((error) => setNotice(error.message));
    api.get(`/tasks${toQuery({ eventId: selectedEventId, status: statusFilter })}`).then(setTasks).catch((error) => setNotice(error.message));
    api.get('/staff').then(setStaff).catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId, statusFilter, dateFilter]);

  async function addTask(event) {
    event.preventDefault();
    try {
      await api.post('/tasks', { ...taskForm, eventId: selectedEventId });
      setNotice('Task created in the guided daily workflow.');
      setTaskForm(newTask);
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateTask(id, changes) {
    try {
      await api.patch(`/tasks/${id}`, changes);
      setNotice('Task status updated.');
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
            <h3>Upcoming events</h3>
            <p>View upcoming event and filter them by date.</p>
          </div>
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Event' },
            { key: 'date', label: 'Date' },
            { key: 'expectedGuests', label: 'Expected guests' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
          ]}
          rows={events}
        />
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Guided daily workflow and task board</h3>
            <p>Track pending, in-progress and done tasks, assign staff, and receive due reminders.</p>
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>

        {role === 'organizer' && (
          <form className="inline-form" onSubmit={addTask}>
            <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            <input placeholder="Category" value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} />
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Assign later</option>
              {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            <button>Create task</button>
          </form>
        )}

        <DataTable
          columns={[
            { key: 'title', label: 'Task' },
            { key: 'category', label: 'Category' },
            { key: 'assignedTo', label: 'Assigned to', render: (row) => staff.find((member) => member.id === row.assignedTo)?.name || 'Unassigned' },
            { key: 'dueDate', label: 'Due date' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
            {
              key: 'actions', label: 'Actions', render: (row) => (
                <div className="button-row">
                  <button className="small" onClick={() => updateTask(row.id, { status: 'In Progress' })}>Start</button>
                  <button className="small" onClick={() => updateTask(row.id, { status: 'Done' })}>Done</button>
                </div>
              )
            }
          ]}
          rows={tasks}
        />
      </section>
    </div>
  );
  // John test commit 2

}
