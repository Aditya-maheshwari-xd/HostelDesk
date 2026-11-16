import { useState } from 'react';
import { api } from '../api';

// Student-only form to raise a new complaint
export default function NewComplaintForm({ categories, onCreated }) {
  const empty = { title: '', description: '', category_id: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api('/complaints', 'POST', form);
      setForm(empty);               // clear the form
      setSuccess('Complaint submitted!');
      onCreated();                  // tell the dashboard to reload the list
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Raise a Complaint</h2>
      <div className="row">
        <select name="category_id" value={form.category_id} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="title" placeholder="Short title (e.g. Fan not working)" value={form.title} onChange={handleChange} />
      </div>
      <textarea
        name="description"
        rows="3"
        placeholder="Describe the problem..."
        value={form.description}
        onChange={handleChange}
      />
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
