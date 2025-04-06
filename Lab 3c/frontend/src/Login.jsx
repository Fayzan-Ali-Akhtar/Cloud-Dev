import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login_url } from './constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(login_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem('accessToken', data.data.AuthenticationResult.AccessToken);
        localStorage.setItem('idToken', data.data.AuthenticationResult.IdToken);
        localStorage.setItem('userRole', data.role);
        navigate('/feed');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 via-sky-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md border-4 border-fuchsia-400 animate-fade-in">
        <h2 className="text-3xl font-extrabold text-fuchsia-600 text-center mb-6">Login</h2>
        
        {message && (
          <div className={`mb-4 px-4 py-2 rounded text-sm text-white ${message.toLowerCase().includes("success") ? 'bg-lime-500' : 'bg-red-500'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded border border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-300 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded border border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-300 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white py-3 rounded font-semibold hover:scale-105 transition-transform"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2 text-sm">
          <p>Don't have an account? <Link to="/signup" className="text-sky-600 hover:underline">Sign Up</Link></p>
          <p><Link to="/confirm" className="text-lime-600 hover:underline">Confirm Account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
