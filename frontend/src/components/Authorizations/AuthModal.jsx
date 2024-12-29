import React from 'react';
import './AuthModal.css';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, children }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();  // Call the onClose function to manage modal state
    navigate(-1); // Navigate back to the previous page
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-button" onClick={handleClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default AuthModal;
