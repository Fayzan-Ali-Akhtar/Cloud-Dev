import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login_url } from './constants';
import LoadingSpinner from './components/LoadingSpinner';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-100 to-primary-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden transform transition-all animate-fade-in">
          <div className="bg-secondary text-secondary-foreground py-6 px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Welcome Back</h2>
            <p className="text-secondary-50 mt-1 text-sm">Log in to your account</p>
          </div>
          
          <div className="p-6 md:p-8">
            {message && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.toLowerCase().includes("success") ? 'bg-success-100 text-success-800 border border-success-300' : 'bg-destructive-50 text-destructive border border-destructive/20'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-300 focus:border-secondary-400 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-300 focus:border-secondary-400 outline-none transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary hover:bg-secondary-600 focus:bg-secondary-700 text-secondary-foreground py-3 rounded-lg font-medium transition-all focus:ring-4 focus:ring-secondary-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Logging in...</span>
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Don't have an account? <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">Sign Up</Link>
              </p>
              <p className="text-gray-600 text-sm">
                <Link to="/confirm" className="text-secondary-600 hover:text-secondary-700 font-medium">Confirm Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;