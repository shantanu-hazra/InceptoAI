import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/NavBar.jsx'; // Import Navbar component
import InterviewPage from './components/interviewPage/InterviewPage.jsx';
import ResultPage from './components/ResultPage/ResultPage.jsx';
import LoginPage from './components/Authorizations/LoginPage.jsx';
import SignupPage from './components/Authorizations/SignupPage.jsx';
import HomePage from './components/homepage/HomePage.jsx';
import { AuthProvider } from "./components/AuthContext/AuthProvider.jsx";
import './App.css';

// Create a custom component to access location inside Router
const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      {/* Show Navbar only if not on login or signup page */}
      {location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !=="/interview" &&(
        <Navbar />
      )}
      <Routes>
        
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </>
  );
}

function App() {
  const [userId, setUserId] = useState(null);

  // Define handleAuth to manage login, signup, and logout actions
  const handleAuth = (action, userId) => {
    if (action === "signup") {
      setUserId(userId);  // Set userId on signup
    } else if (action === "login") {
      setUserId(userId);  // Set userId on login
    } else if (action === "logout") {
      setUserId(null); // Reset userId on logout
    }
  };

  return (
    <div className="App">
      <AuthProvider>
          <Router>
            <div className="parent-container">
              <AppRoutes /> {/* Use the custom component to handle routes */}
            </div>
          </Router>
      </AuthProvider>
    </div>
  );
}

export default App;

