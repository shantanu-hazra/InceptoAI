import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, BookOpen, ChevronRight } from 'lucide-react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext/AuthProvider';

const HomePage = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const {userId} = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`https://inceptoai.onrender.com/incepto/${userId}`);
        setResults(response.data);
      } catch (error) {
        console.error('There was an error fetching the userId!', error);
      }
    };
    if(userId){
      fetchUserId();
    }
  }, [userId]);

  function navigateToResult(id,index){
    navigate(`/result`,{ state : { id,index } })
  }

  function handleStart(){
    navigate("/interview")
  }

  return (
    <div className="container">
      <div className="content-wrapper">
        <header className="header">
          <h1 className="title">Welcome to InceptoAI</h1>
          <p className="subtitle">Your AI-Powered Interview Preparation Platform</p>
        </header>

        <div className="quick-start-card">
          <div className="card-header">
            <h2 className="card-title">Quick Start</h2>
              <button type="submit" className="start-button1" onClick={handleStart}>
                Start Interview
                <ChevronRight className="button-icon" size={16} />
              </button>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="icon-wrapper blue-icon">
                <CalendarDays size={24} />
              </div>
              <div className="feature-text">
                <p className="feature-title">Practice Sessions</p>
                <p className="feature-description">Schedule Mock Interviews</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="icon-wrapper green-icon">
                <BookOpen size={24} />
              </div>
              <div className="feature-text">
                <p className="feature-title">Topics</p>
                <p className="feature-description">Explore Interview Topics</p>
              </div>
            </div>
          </div>
        </div>

        <div className="interview-list">
          <h2 className="section-title">Previous Interviews</h2>

          {results.length > 0 ? (
            <>
              <div className="list-header">
                <div>#</div>
                <div>Date</div>
                <div>Topic</div>
                <div className="align-right">Result</div>
              </div>
              {results.map((result, index) => (
                <div key={index} className="list-item">
                  <div className="item-index">{index + 1}</div>
                  <div>{result.date.slice(0, 10)}</div>
                  <div>{result.topic}</div>
                  <div className="align-right">
                    <button type="submit" className="result-button" onClick={()=>navigateToResult(result._id,index)}>
                      Show Result
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-text">
                Let's practice a mock interview!
              </h3>
              <form action="/interview" method="get">
                <button type="submit" className="start-button2">
                  Start Your First Interview  
                  <ChevronRight className="button-icon" size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;