import { useState } from 'react';

// Status + category dropdowns apply immediately.
// Search applies when you press Enter or click "Search" (so we don't call the API on every key).
export default function Filters({ categories, filters, onChange }) {
  const [searchText, setSearchText] = useState(filters.search);

  function handleSearch(e) {
    e.preventDefault();
    onChange({ ...filters, search: searchText });
  }

  function clearAll() {
    setSearchText('');
    onChange({ status: '', category: '', search: '' });
  }

  return (
    <form className="filters" onSubmit={handleSearch}>
      <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <select value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input
        placeholder="Search title, description or room"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button type="submit">Search</button>
      <button type="button" className="btn-light" onClick={clearAll}>Clear</button>
    </form>
  );
}
