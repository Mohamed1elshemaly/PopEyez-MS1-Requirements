import { useState } from 'react';

const demoAccounts = [
  { label: 'Event Organizer', email: 'organizer@popeyez.com', role: 'organizer' },
  { label: 'Team Member / Staff', email: 'staff.setup@popeyez.com', role: 'staff' },
  { label: 'Vendor / Supplier', email: 'vendor.beans@example.com', role: 'vendor' },
  { label: 'Guest', email: 'mariam@example.com', role: 'guest' },
  { label: 'Venue Owner', email: 'owner@downtownspaces.com', role: 'venueOwner' }
];

export default function Login({ onLogin, notice }) {
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [localNotice, setLocalNotice] = useState('');

  const selectedAccount = demoAccounts.find((account) => account.email === email) || demoAccounts[0];

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setLocalNotice('');

    try {
      await onLogin({ email, password });
    } catch (error) {
      setLocalNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark large">PE</div>
          <div>
            <p className="eyebrow">Milestone 2 Full-Stack Application</p>
            <h1>Welcome to PopEyez</h1>
            <p>Login to access the correct dashboard for your user journey.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Demo account
            <select value={email} onChange={(event) => setEmail(event.target.value)}>
              {demoAccounts.map((account) => (
                <option key={account.email} value={account.email}>{account.label} — {account.email}</option>
              ))}
            </select>
          </label>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="demo123" />
          </label>

          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : `Login as ${selectedAccount.label}`}</button>
        </form>

        {(localNotice || notice) && <div className="login-error">{localNotice || notice}</div>}

        <div className="demo-credentials">
          <strong>Demo password:</strong> demo123
          <span>Use the dropdown to test Organizer, Staff, Vendor, Guest, and Venue Owner journeys.</span>
        </div>
      </section>
    </main>
  );
}
