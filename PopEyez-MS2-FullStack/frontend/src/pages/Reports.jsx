import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';

export default function Reports({ selectedEventId, setNotice }) {
  const [report, setReport] = useState(null);
  const [feedback, setFeedback] = useState([]);

  function load() {
    api.get(`/reports/${selectedEventId}`).then(setReport).catch((error) => setNotice(error.message));
    api.get(`/feedback?eventId=${selectedEventId}`).then(setFeedback).catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  function exportReport() {
    window.open(`${api.baseUrl}/reports/${selectedEventId}/export`, '_blank');
  }

  if (!report) return <section className="panel">Loading report...</section>;

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Post-event reports and analytics</h3>
            <p>Review feedback and export reports covering costs, attendance and outcomes.</p>
          </div>
          <button onClick={exportReport}>Export report JSON</button>
        </div>
        <div className="stats-grid">
          <StatCard title="Invited" value={report.attendance.invited} />
          <StatCard title="Checked in" value={report.attendance.checkedIn} />
          <StatCard title="Actual expenses" value={`${report.costs?.actualTotal || 0} EGP`} />
          <StatCard title="Overall feedback" value={report.feedbackSummary.overallAverage} />
        </div>
      </section>

      <section className="panel two-column">
        <div>
          <h3>Outcome summary</h3>
          <pre className="report-box">{JSON.stringify({ attendance: report.attendance, taskProgress: report.taskProgress, vendorProgress: report.vendorProgress }, null, 2)}</pre>
        </div>
        <div>
          <h3>Collected feedback</h3>
          <DataTable
            columns={[
              { key: 'guestId', label: 'Guest' },
              { key: 'overall', label: 'Overall' },
              { key: 'food', label: 'Food' },
              { key: 'venue', label: 'Venue' },
              { key: 'organization', label: 'Organization' },
              { key: 'comments', label: 'Comments' }
            ]}
            rows={feedback}
          />
        </div>
      </section>
    </div>
  );
}
