import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { confirm_url } from './constants';

const Confirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('SimpleUsers');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(confirm_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, role }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        navigate('/login');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-fuchsia-100 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md border-4 border-lime-400 animate-fade-in">
        <h2 className="text-3xl font-extrabold text-lime-600 text-center mb-6">Confirm Account</h2>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded text-sm text-white ${message.toLowerCase().includes("success") ? 'bg-sky-500' : 'bg-red-500'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded border border-lime-300 focus:ring-4 focus:ring-lime-300 outline-none"
            required
          />
          <input
            type="text"
            placeholder="Confirmation Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 rounded border border-lime-300 focus:ring-4 focus:ring-lime-300 outline-none"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded border border-lime-300 focus:ring-4 focus:ring-lime-300 outline-none"
          >
            <option value="SimpleUsers">SimpleUsers</option>
            <option value="Admins">Admins</option>
          </select>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-lime-500 via-green-500 to-teal-500 text-white py-3 rounded font-semibold hover:scale-105 transition-transform"
            disabled={loading}
          >
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2 text-sm">
          <p><Link to="/login" className="text-fuchsia-600 hover:underline">Login</Link></p>
          <p><Link to="/signup" className="text-sky-600 hover:underline">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
