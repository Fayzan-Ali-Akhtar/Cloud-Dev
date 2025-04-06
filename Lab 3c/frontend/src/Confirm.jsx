import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirm_url } from './constants'; 

const Confirm = () => {
  // Retrieve the email passed from the signup page, if available.
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('SimpleUsers'); // default role
  const [message, setMessage] = useState('');

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(confirm_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, role })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        // Navigate to login after successful confirmation.
        navigate('/login');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      setMessage('Confirmation failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Confirm Your Account</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleConfirm}>
        <label>
          Email:
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </label>
        <br />
        <label>
          Confirmation Code:
          <input 
            type="text" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            required 
          />
        </label>
        <br />
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="SimpleUsers">SimpleUsers</option>
            <option value="Admins">Admins</option>
          </select>
        </label>
        <br />
        <button type="submit">Confirm Account</button>
      </form>
    </div>
  );
};

export default Confirm;
