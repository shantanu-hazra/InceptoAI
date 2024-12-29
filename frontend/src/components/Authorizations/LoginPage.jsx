import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "../AuthContext/AuthProvider.jsx";
import './AuthPages.css';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post("https://inceptoai.onrender.com/login", formData);
      
      // Check if response has data and id
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }

      // Login successful
      login(response.data.id);
      
      // Determine where to navigate
      const returnTo = location.state?.from || "/";
      navigate(returnTo, { replace: true });
      
    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          setError('Invalid email or password');
        } else {
          setError('An error occurred during login. Please try again.');
        }
      } else if (err.request) {
        // No response received
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        // Other errors
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            type="email"
            className="inputField"
            id="login-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            className="inputField"
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="signup-prompt">
        <p>Don't have an account?</p>
        <button 
          onClick={() => navigate("/signup")} 
          className="auth-button"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default LoginPage;