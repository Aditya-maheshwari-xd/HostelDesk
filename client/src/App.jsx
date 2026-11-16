import { useState } from 'react';
import { getSavedUser, logout } from './api';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

// App decides what to show:
//   - not logged in  -> login / register page
//   - logged in      -> the dashboard for that user's role
export default function App() {
  const [user, setUser] = useState(getSavedUser());

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div>
      <header className="navbar">
        <h1>HostelDesk</h1>
        <div>
          <span className="who">
            {user.name} <span className="role">{user.role}</span>
          </span>
          <button className="btn-light" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="container">
        <Dashboard user={user} />
      </main>
    </div>
  );
}
