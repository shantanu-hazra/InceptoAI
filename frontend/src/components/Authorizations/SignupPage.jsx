import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {useNavigate, useLocation} from "react-router-dom"
import {useAuth} from "../AuthContext/AuthProvider.jsx";
import './AuthPages.css';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {signup}=useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://inceptoai.onrender.com/signup", { username, email, password });
      
      signup(response.data.id);
      navigate("/");
      
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-box">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Name</label>
          <input
            type="text"
            className='inputField'
            id={`signup-email-${Math.random().toString(36).substr(2, 9)}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            type="email"
            className='inputField'
            id={`signup-email-${Math.random().toString(36).substr(2, 9)}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            type="password"
            className='inputField'
            id={`signup-email-${Math.random().toString(36).substr(2, 9)}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            className='inputField'
            id={`signup-email-${Math.random().toString(36).substr(2, 9)}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Sign Up</button>
      </form>
      <div className="signup-prompt">
        <p>Don't have an account?</p>
        <button onClick={() => navigate("/signup")} className="auth-button">Sign Up</button>
      </div>
    </div>
  );
};

export default SignupPage;
