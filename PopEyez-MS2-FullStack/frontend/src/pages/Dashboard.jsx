import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusPill from '../components/StatusPill.jsx';

export default function Dashboard({ selectedEventId, setNotice }) {
  const [dashboard, setDashboard] = useState(null);

  function load() {
    api.get(`/dashboard?eventId=${selectedEventId}`)
      .then(setDashboard)
      .catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  if (!dashboard) return <section className="panel">Loading dashboard...</section>;

  return (
    <div className="page-grid">
      <section className="hero panel">
        <p className="eyebrow">Today overview</p>
        <h3>{dashboard.selectedEvent.name}</h3>
        <p>{dashboard.selectedEvent.agenda}</p>
      </section>

      <div className="stats-grid">
        <StatCard title="Upcoming events" value={dashboard.totals.upcomingEvents} />
        <StatCard title="Guests arrived" value={`${dashboard.totals.arrivedGuests}/${dashboard.totals.totalGuests}`} />
        <StatCard title="Pending tasks" value={dashboard.totals.pendingTasks} />
        <StatCard title="Actual expenses" value={`${dashboard.totals.actualExpenses} EGP`} hint={`Planned: ${dashboard.totals.plannedBudget} EGP`} />
        <StatCard title="Feedback average" value={dashboard.totals.feedbackAverage} />
      </div>

      <section className="panel two-column">
        <div>
          <h3>Upcoming events</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Event' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
            ]}
            rows={dashboard.upcomingEvents}
          />
        </div>
        <div>
          <h3>Due tasks</h3>
          <DataTable
            columns={[
              { key: 'title', label: 'Task' },
              { key: 'dueDate', label: 'Due date' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> }
            ]}
            rows={dashboard.dueTasks}
          />
        </div>
      </section>
    </div>
  );
}
