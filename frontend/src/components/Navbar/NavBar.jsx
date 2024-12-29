import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../Authorizations/AuthModal';
import LoginPage from '../Authorizations/LoginPage';
import SignupPage from '../Authorizations/SignupPage';
import { useAuth } from "../AuthContext/AuthProvider.jsx";
import './NavBar.css';

const Navbar = () => {
  const { userId, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // Track whether it's login or signup
  const navigate = useNavigate();

  const handleAuth = (act) => {
    if (act === "logout") {
      logout();
      navigate("/");
    }
  };

  const handleLogin = () => {
    setAuthMode("login"); // Set auth mode to login
    setIsAuthModalOpen(true); // Open modal
    navigate("/login", { state: { from: window.location.pathname } });
  };

  const handleSignup = () => {
    setAuthMode("signup"); // Set auth mode to signup
    setIsAuthModalOpen(true); // Open modal
    navigate("/signup", { state: { from: window.location.pathname } });
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthMode(null); // Reset auth mode
    // navigate(-1); // Navigate back to the previous page
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <div className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </div>
            <div className="nav-item">
              <Link to="/interview" className="nav-link">New Interview</Link>
            </div>
          </div>
          <div className="navbar-right">
            {userId === null ? (
              <>
                <div className="nav-item">
                  <button onClick={handleLogin} className="auth-button">Login</button>
                </div>
                <div className="nav-item">
                  <button onClick={handleSignup} className="auth-button">Sign Up</button>
                </div>
              </>
            ) : (
              <div className="nav-item">
                <button onClick={() => handleAuth("logout")} className="auth-button">Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal}>
        {authMode === "login" ? (
          <LoginPage onLogin={closeAuthModal} onClose={closeAuthModal} />
        ) : (
          <SignupPage onSignup={closeAuthModal} onClose={closeAuthModal} />
        )}
      </AuthModal>
    </>
  );
};

export default Navbar;
