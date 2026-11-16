import { useEffect, useState } from 'react';
import { api } from '../api';
import NewComplaintForm from '../components/NewComplaintForm';
import StatsCards from '../components/StatsCards';
import Filters from '../components/Filters';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetail from '../components/ComplaintDetail';

// One dashboard for all three roles. The parts shown change with user.role:
//   student -> "raise complaint" form + their own complaints
//   warden  -> status cards + ALL complaints (can assign / close)
//   staff   -> only complaints assigned to them (can mark in progress / resolved)
export default function Dashboard({ user }) {
  const [categories, setCategories] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  // Load categories once, when the dashboard first appears
  useEffect(() => {
    api('/categories').then(setCategories).catch((err) => setError(err.message));
  }, []);

  // Load the list (and stats for warden). Called on start, on filter change, and after any action.
  async function loadData() {
    try {
      // URLSearchParams builds "status=open&search=fan" for us
      const query = new URLSearchParams();
      if (filters.status) query.set('status', filters.status);
      if (filters.category) query.set('category', filters.category);
      if (filters.search) query.set('search', filters.search);

      const list = await api('/complaints?' + query.toString());
      setComplaints(list || []);

      if (user.role === 'warden') {
        setStats(await api('/complaints/stats'));
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Re-run loadData every time the filters object changes
  useEffect(() => {
    loadData();
  }, [filters]);

  const titles = {
    student: 'My Complaints',
    warden: 'All Complaints',
    staff: 'My Assigned Tasks',
  };

  return (
    <div>
      {user.role === 'student' && (
        <NewComplaintForm categories={categories} onCreated={loadData} />
      )}
      {user.role === 'warden' && stats && <StatsCards stats={stats} />}

      <div className="card">
        <h2>{titles[user.role]}</h2>
        <Filters categories={categories} filters={filters} onChange={setFilters} />
        {error && <p className="error">{error}</p>}
        <ComplaintTable
          complaints={complaints}
          role={user.role}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {selectedId && (
        <ComplaintDetail
          id={selectedId}
          user={user}
          onClose={() => setSelectedId(null)}
          onChanged={loadData}
        />
      )}
    </div>
  );
}
