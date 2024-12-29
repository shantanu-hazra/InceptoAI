import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext/AuthProvider";
import { useLocation } from "react-router-dom";
import "./ResultPage.css";

const ResultPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const location = useLocation();
  const resultId = location.state?.id || null;

  useEffect(() => {
    const fetchResults = async () => {
      if (!userId || !resultId) {
        setError("Missing user ID or result ID");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `https://inceptoai.onrender.com/interview-result/${userId}/${resultId}`
        );
        setInterviewData(response.data);
      } catch (error) {
        console.error("Error fetching interview results:", error);
        setError("Failed to fetch interview results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [userId, resultId]);

  if (loading) {
    return <div className="result-page">Loading results...</div>;
  }

  if (error) {
    return <div className="result-page">
      <h1>Your Interview Report</h1>
      <div className="error-message">{error}</div>
    </div>;
  }

  if (!interviewData) {
    return <div className="result-page">No interview data available.</div>;
  }

  // Function to render markdown-style text with line breaks
  const renderMarkdownText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line.startsWith('**') ? (
          <strong>{line.replace(/\*\*/g, '')}</strong>
        ) : line.startsWith('* ') ? (
          <li>{line.substring(2)}</li>
        ) : (
          line
        )}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="result-page">
      <h1>Your Interview Report</h1>
      <div className="results-container">
        {interviewData.interview_feedback?.map((item, index) => (
          <div className="card" key={index}>
            <h2>Question {index + 1}:</h2>
            <p>"{item.question}"</p>

            <br />
            <hr />
            <br />

            <h2>Answer:</h2>
            <p>"{item.answer}"</p>

            <br />
            <hr />
            <br />

            <h2>Feedback:</h2>
            <p>{item.feedback}</p>
          </div>
        ))}

        {interviewData.emotional_analysis && (
          <div className="card">
            <h2>Emotional Analysis</h2>
            <div className="confidence-score">
              <h3>Confidence Score:</h3>
              <p>{interviewData.emotional_analysis.confidenceScore}</p>
            </div>
            <br />
            <div className="evaluation">
            <h3>Evaluation:</h3>
              <p>{renderMarkdownText(interviewData.emotional_analysis.evaluation)}</p>
            </div>
          </div>
        )}

        {interviewData.speech_analysis && (
          <div className="card">
            <h2>Speech Analysis:</h2>
            <p>{interviewData.speech_analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPage;