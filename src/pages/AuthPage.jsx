// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Registration successful! You are now logged in.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
      }
      navigate('/'); // Redirect to home page on success
    } catch (err) {
      console.error('Auth error:', err.message);
      setError(err.message.replace('Firebase: ', '')); // Clean up error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <h2 style={authStyles.title}>LIFE OS</h2>
        <p style={authStyles.subtitle}>
          {isRegistering ? 'Create Your Account' : 'Login to Your Account'}
        </p>
        <form onSubmit={handleSubmit} style={authStyles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={authStyles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={authStyles.input}
            required
          />
          <button type="submit" style={authStyles.button} disabled={loading}>
            {loading
              ? 'Processing...'
              : isRegistering
              ? 'Register'
              : 'Login'}
          </button>
          {error && <p style={authStyles.error}>{error}</p>}
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={authStyles.toggleButton}
        >
          {isRegistering
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

const authStyles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--background-dark)', // Dark background
    color: 'var(--text-light)', // Light text
  },
  card: {
    backgroundColor: 'var(--surface-dark)', // Slightly lighter dark for card
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--border-color)',
  },
  title: {
    fontSize: '2.8em',
    color: 'var(--primary-purple)', // Purple logo color
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '1.2em',
    color: 'var(--text-secondary)',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  input: {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--background-dark)', // Darker input background
    color: 'var(--text-light)',
    fontSize: '1em',
  },
  button: {
    backgroundColor: 'var(--primary-purple)', // Purple button
    color: 'white',
    padding: '15px 25px',
    borderRadius: '8px',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.1s ease',
  },
  buttonHover: {
    backgroundColor: 'var(--primary-purple-hover)',
  },
  toggleButton: {
    marginTop: '20px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    fontSize: '0.9em',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.2s ease',
  },
  toggleButtonHover: {
    color: 'var(--text-light)',
  },
  error: {
    color: 'var(--accent-red)',
    marginTop: '15px',
    fontSize: '0.9em',
  },
};

export default AuthPage;