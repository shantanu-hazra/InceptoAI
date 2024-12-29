import React, { useState } from 'react';
import './InterviewStartPrompt.css';

const InterviewStartPrompt = ({ onStartInterview }) => {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');

  const handleStart = () => {
    if (role && company) {
      onStartInterview(role, company); // Pass data to InterviewPage for permissions and API call
    } else {
      alert('Please enter both role and company!');
    }
  };

  return (
    <div className="interview-start-prompt">
      <div className="prompt-content">
        <input 
          type="text" 
          placeholder="Role" 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          required
        />
        <input 
          type="text" 
          placeholder="Company" 
          value={company} 
          onChange={(e) => setCompany(e.target.value)} 
          required
        />
        <button onClick={handleStart}>Start Interview</button>
      </div>
    </div>
  );
};

export default InterviewStartPrompt;
