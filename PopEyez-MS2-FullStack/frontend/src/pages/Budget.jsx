import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';

export default function Budget({ selectedEventId, setNotice }) {
  const [budget, setBudget] = useState(null);
  const [plannedTotal, setPlannedTotal] = useState('');
  const [plannedItem, setPlannedItem] = useState({ name: '', amount: '' });
  const [expense, setExpense] = useState({ name: '', amount: '', date: '' });

  function load() {
    api.get(`/budgets/${selectedEventId}`)
      .then((data) => {
        setBudget(data);
        setPlannedTotal(data.plannedTotal || '');
      })
      .catch((error) => setNotice(error.message));
  }

  useEffect(load, [selectedEventId]);

  async function updatePlannedTotal(event) {
    event.preventDefault();
    try {
      await api.patch(`/budgets/${selectedEventId}`, { plannedTotal: Number(plannedTotal) });
      setNotice('Planned total budget updated.');
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addPlannedItem(event) {
    event.preventDefault();
    try {
      await api.post(`/budgets/${selectedEventId}/planned-items`, plannedItem);
      setNotice('Planned budget decomposition item added.');
      setPlannedItem({ name: '', amount: '' });
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addExpense(event) {
    event.preventDefault();
    try {
      await api.post(`/budgets/${selectedEventId}/actual-expenses`, expense);
      setNotice('Actual expense recorded.');
      setExpense({ name: '', amount: '', date: '' });
      load();
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!budget) return <section className="panel">Loading budget...</section>;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Planned total" value={`${budget.plannedTotal} EGP`} />
        <StatCard title="Planned decomposition" value={`${budget.plannedItemsTotal} EGP`} />
        <StatCard title="Actual expenses" value={`${budget.actualTotal} EGP`} />
        <StatCard title="Remaining" value={`${budget.remainingAgainstPlannedTotal} EGP`} />
      </div>

      <section className="panel two-column">
        <div>
          <h3>Planned budget</h3>
          <form className="inline-form" onSubmit={updatePlannedTotal}>
            <input type="number" value={plannedTotal} onChange={(e) => setPlannedTotal(e.target.value)} />
            <button>Update total</button>
          </form>
          <form className="inline-form" onSubmit={addPlannedItem}>
            <input placeholder="Budget category" value={plannedItem.name} onChange={(e) => setPlannedItem({ ...plannedItem, name: e.target.value })} />
            <input type="number" placeholder="Amount" value={plannedItem.amount} onChange={(e) => setPlannedItem({ ...plannedItem, amount: e.target.value })} />
            <button>Add item</button>
          </form>
          <DataTable columns={[{ key: 'name', label: 'Item' }, { key: 'amount', label: 'Amount' }]} rows={budget.plannedItems} />
        </div>
        <div>
          <h3>Actual expenses</h3>
          <form className="inline-form" onSubmit={addExpense}>
            <input placeholder="Expense" value={expense.name} onChange={(e) => setExpense({ ...expense, name: e.target.value })} />
            <input type="number" placeholder="Amount" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
            <input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} />
            <button>Add expense</button>
          </form>
          <DataTable columns={[{ key: 'name', label: 'Expense' }, { key: 'amount', label: 'Amount' }, { key: 'date', label: 'Date' }]} rows={budget.actualExpenses} />
        </div>
      </section>
    </div>
  );
}
