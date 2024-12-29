import React, { useState, useEffect, useRef } from "react";
import InterviewStartPrompt from "./InterviewStartPrompt";
import axios from "axios";
import "./InterviewPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext/AuthProvider";
import * as faceapi from "face-api.js";

const InterviewPage = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(true);
  const videoRef = useRef(null);
  const [result, setResult] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [confidenceValues, setConfidenceValues] = useState([]);
  const [isVideoDetectionActive, setIsVideoDetectionActive] = useState(false);
  const confidenceValuesRef = useRef([]);
  const [role,setRole]=useState("");

  const calculateAverageConfidence = (values) => {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  };

  const startVideoDetection = async (stream) => {
    const videoElement = document.createElement("video");
    const displaySize = { width: 640, height: 480 };
    
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");

      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    
    const detectFaces = async () => {
      if (!isVideoDetectionActive) {
        return;
      }
      
      try {
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
          
        if (detections && detections.length > 0) {
          const detection = detections[0];
          const expressions = detection.expressions;
          const highestConfidence = Math.max(
            expressions.happy || 0,
            expressions.neutral || 0
          );

          confidenceValuesRef.current = [...confidenceValuesRef.current, highestConfidence];
          setConfidenceValues(prev => [...prev, highestConfidence]);
        }

        if (isVideoDetectionActive) {
          setTimeout(detectFaces, 3000);
        }
      } catch (error) {
        console.error("Face detection error:", error);
        if (isVideoDetectionActive) {
          setTimeout(detectFaces, 3000);
        }
      }
    };
  
    try {
      videoElement.srcObject = stream;
      await loadModels();
      await videoElement.play();
      detectFaces();
    } catch (error) {
      console.error("Error starting video detection:", error);
    }
  };

  useEffect(() => {
    let fetchTimeout;
    let isComponentMounted = true;

    async function getQuestion() {
      if (!isComponentMounted || (questions.length >= 5 && isFetching)) {
        return;
      }

      setIsFetching(true);

      try {
        const response = await axios.post("https://inceptoai.onrender.com/questions");
        if (response.data.recent === 0) {
          return;
        }

        const updatedQuestions = [];

        response.data.data.forEach((item) => {
          const questionNumber = item.question_number;
          if (!updatedQuestions[questionNumber]) {
            updatedQuestions[questionNumber] = item.question;
          }
        });

        if (isComponentMounted) {
          const updatedArray = Object.values(updatedQuestions);
          setQuestions(updatedArray);

          if (updatedArray.length === 1 && videoRef.current) {
            const stream = videoRef.current.srcObject;
            setIsVideoDetectionActive(true);
            startVideoDetection(stream);
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        if (isComponentMounted) {
          setIsFetching(false);
          if (questions.length < 5) {
            fetchTimeout = setTimeout(getQuestion, 4000);
          }
        }
      }
    }

    getQuestion();

    return () => {
      isComponentMounted = false;
      clearTimeout(fetchTimeout);
      setIsVideoDetectionActive(false);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login", { state: { from: "/interview" } });
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (questions.length > 0) {
      setLoading(false);
    }
  }, [questions]);

  const handleStartInterview = async (enteredRole, enteredCompany) => {
    try {
      setLoading(true);
      setShowPrompt(false);
      setRole(enteredRole);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const response = await axios.post(
        `https://inceptoai.onrender.com/run-interview`,
        {
          role: enteredRole,
          company: enteredCompany,
        }
      );

      setResult(response.data.result);
      if (response.data.isComplete) {
        setComplete(true);
      }
    } catch (error) {
      console.error("Error during interview setup:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      setIsVideoDetectionActive(false);

      const finalConfidenceValues = confidenceValuesRef.current;
      const avgConfidence = calculateAverageConfidence(finalConfidenceValues);

      const response=await axios.post(`https://inceptoai.onrender.com/save-confidence`, {
        avgConfidence: avgConfidence,
        userId,
        role,
      });

      setResult(response.data);
      
      navigate(`/result`, { state: { result } });
    } catch (error) {
      console.error("Error completing interview:", error);
    }
  };

  const handleQuestionClick = (index) => {
    setSelectedQuestionIndex(selectedQuestionIndex === index ? null : index);
  };

  return (
    <div className="interview-page">
      {showPrompt ? (
        <div className="interview-modal">
          <div className="interview-modal-content">
            <InterviewStartPrompt onStartInterview={handleStartInterview} />
          </div>
        </div>
      ) : (
        <div className="interview-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Interview is loading, please wait...</p>
            </div>
          )}
          <div className="questions-section">
            <div className="questions-container">
              <h2>Interview Questions</h2>
              <ul className="ques">
                {questions.map((question, index) => (
                  <li
                    key={index}
                    className={`question-item ${
                      selectedQuestionIndex === index ? "expanded" : ""
                    }`}
                    onClick={() => handleQuestionClick(index)}
                  >
                    {question.slice(0, 20)}...
                  </li>
                ))}
              </ul>
            </div>
            <div className="question-display">
              {selectedQuestionIndex !== null && selectedQuestionIndex >= 0 && (
                <div className="selected-question">
                  {questions[selectedQuestionIndex]}
                </div>
              )}
            </div>
          </div>
          <div className="camera-section">
            <div className="camera-placeholder">
              <video
                autoPlay
                muted
                playsInline
                ref={videoRef}
              />
            </div>
            {complete && (
              <button
                onClick={handleCompleteInterview}
                className="complete-interview-btn"
              >
                End Interview
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;