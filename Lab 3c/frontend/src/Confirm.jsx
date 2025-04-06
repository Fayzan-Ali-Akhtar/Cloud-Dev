import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { confirm_url } from './constants';
import LoadingSpinner from './components/LoadingSpinner';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-100 to-secondary-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden transform transition-all animate-fade-in">
          <div className="bg-accent text-accent-foreground py-6 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Confirm Your Account</h2>
            <p className="text-accent-100 mt-1 text-sm">Enter your verification code</p>
          </div>
          
          <div className="p-6 md:p-8">
            {message && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.toLowerCase().includes("success") ? 'bg-success-100 text-success-800 border border-success-300' : 'bg-destructive-50 text-destructive border border-destructive/20'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 outline-none transition-all bg-white"
                >
                  <option value="SimpleUsers">SimpleUsers</option>
                  <option value="Admins">Admins</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-600 focus:bg-accent-700 text-accent-foreground py-3 rounded-lg font-medium transition-all focus:ring-4 focus:ring-accent-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Confirming...</span>
                  </>
                ) : 'Confirm Account'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Already confirmed? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login</Link>
              </p>
              <p className="text-gray-600 text-sm">
                Need an account? <Link to="/signup" className="text-secondary-600 hover:text-secondary-700 font-medium">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirm;