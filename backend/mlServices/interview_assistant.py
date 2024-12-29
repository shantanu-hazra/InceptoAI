import os
import cv2
import json
import speech_recognition as sr
import librosa
import numpy as np
from fer import FER
import datetime
import time
import asyncio
import edge_tts
import pygame
import tempfile
from langchain_google_genai import ChatGoogleGenerativeAI
from decouple import config
import threading
import sys
import atexit

# Initialize Gemini AI
api_key = config("GOOGLE_GEMINI_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=api_key)

class InterviewAssistant:
    def __init__(self,role,company):
        self.feedback_folder = os.path.join(os.getcwd(), "uploads")

        # Create the folder if it doesn't exist
        if not os.path.exists(self.feedback_folder):
            os.makedirs(self.feedback_folder)
            
        self.role=role
        self.company=company
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.speech_analyzer = SpeechAnalyzer(self.timestamp)
        self.feedback = []
        self.conversation_history = ""  # Track interview conversation history

        pygame.mixer.init()
        
    def save_question(self, content=None,ques_num=None):
        """Save the generated content (question) to the JSON file."""
        temp_files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tempFiles')
        file_path = os.path.join(temp_files_dir, 'question.json')

        # Check if the JSON file exists
        if os.path.exists(file_path):
            # Read the existing content of the JSON file
            if(ques_num==1 or ques_num==0): #clear the file if first question
                data=[]
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
        else:
            # If the file doesn't exist, initialize an empty list
            data = []
        
        # Append the new question to the list
        if(content and ques_num):
            question = {
                "question_number": ques_num,  # Automatically number the question
                "question": content
            }
            data.append(question)
        

        # Write the updated data back to the JSON file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    
    def generate_next_question(self, question_number):
        interview_prompt = f"""
        You are an experienced technical interviewer at {self.company} conducting an interview for a {self.role} position.
        This is question {question_number} out of 5.
        Based on the following conversation history, ask the next most appropriate interview question.
        Make your questions specific to the role and company.
        Ask one question at a time, and make it conversational like a real interviewer.
        If the previous answer warrants a follow-up question, ask that instead of moving to a new topic.

        Conversation history:
        {self.conversation_history}

        Provide only the next question without any additional text.
        """
        result = llm.invoke(interview_prompt)

        self.save_question(result.content,question_number)
        return result.content

    def save_feedback(self, feedback_content, feedback_filename="feedback.json"):
        
        feedback_path = os.path.join(self.feedback_folder, feedback_filename)

        with open(feedback_path, 'w') as feedback_file:
            json.dump(feedback_content, feedback_file, indent=4)

    async def speak(self, text):
        voice = "en-US-JennyNeural"
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save("temp.mp3")
        pygame.mixer.music.load("temp.mp3")
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)

        pygame.mixer.music.unload()
        os.remove("temp.mp3")

    def listen(self):
        r = sr.Recognizer()
        with sr.Microphone() as source:
            audio = r.listen(source)
            try:
                return r.recognize_google(audio)
            except:
                return None

    def evaluate_answer(self, question, answer, role):
        prompt = f"""
        As an interviewer for {role} position, evaluate:
        Question: {question}
        Answer: {answer}

        Provide:
        1. Rating (1-10)
        2. Strengths
        3. Areas for improvement
        4. Better answer suggestion
        """
        return llm.invoke(prompt).content

    def update_history(self,ques_num,question=None,answer=None):
        temp_files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tempFiles')
        file_path = os.path.join(temp_files_dir, 'history.json')
        
        data=[]
        
        if os.path.exists(file_path):
            # Read the existing content of the JSON file
            if(ques_num==1 or ques_num==0): #clear the file if first question
                data=[]
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
        else:
            # If the file doesn't exist, initialize an empty list
            data = []
            
        # Append the new question to the list
        if(ques_num and question):
            history = {
                "question_number": ques_num,  # Automatically number the question
                "question": question,
                "answer":answer
            }
            data.append(history)

        # Write the updated data back to the JSON file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            
    def clear_history_files(self):
        temp_files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tempFiles')

        # Clear the history.json file
        history_file_path = os.path.join(temp_files_dir, 'history.json')
        if os.path.exists(history_file_path):
            with open(history_file_path, 'w') as history_file:
                json.dump([], history_file)  # Write an empty list to clear the file
        
    def clear_question_files(self):
        temp_files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tempFiles')
        
        # Clear the question.json file
        question_file_path = os.path.join(temp_files_dir, 'question.json')
        if os.path.exists(question_file_path):
            with open(question_file_path, 'w') as question_file:
                json.dump([], question_file)  # Write an empty list to clear the file
        
    async def conduct_interview(self):
        # Start the speech analysis in a separate thread
        self.speech_thread = threading.Thread(target=self.speech_analyzer.start_analysis)
        self.speech_thread.start()

        await self.speak(f"Starting mock interview for {self.role} position at {self.company}")
        time.sleep(1)
        
        # Clear existing history and questions
        self.clear_history_files()
        self.clear_question_files()

        interview_feedback = []
        for question_number in range(1, 6):
            question = self.generate_next_question(question_number)
            await self.speak(question)
            answer = self.listen()
            if answer:
                # Update conversation history with the question and answer
                self.conversation_history += f"\nQuestion {question_number}: {question}\nAnswer: {answer}\n"
                self.update_history(question_number, question, answer)

                # Evaluate the answer and collect feedback
                feedback = self.evaluate_answer(question, answer, self.role)
                interview_feedback.append({
                    "question_number": question_number,
                    "question": question,
                    "answer": answer,
                    "feedback": feedback
                })
        
        # Stop the speech analysis and collect results
        self.speech_analyzer.stop_analysis()
        self.speech_thread.join()

        # Add speech analysis results to the feedback
        speech_analysis = self.speech_analyzer.get_analysis()
        final_feedback = {
            "interview_feedback": interview_feedback,
            "speech_analysis": speech_analysis
        }

        # Save the final feedback to the feedback file
        self.save_feedback(final_feedback)

        # Provide closing message
        await self.speak("The mock interview has concluded. Thank you!")
        self.clear_question_files()


class SpeechAnalyzer:
    def __init__(self, timestamp):
        self.timestamp = timestamp
        self.output_path = f"speech_analysis_{self.timestamp}.json"
        self.speech_data = []
        self.is_running = False

    def start_analysis(self):
        r = sr.Recognizer()
        self.is_running = True
        with sr.Microphone() as source:
            try:
                while self.is_running:
                    audio = r.listen(source)
                    try:
                        text = r.recognize_google(audio)
                        timestamp = datetime.datetime.now().isoformat()
                        self.speech_data.append({"timestamp": timestamp, "transcription": text})
                    except sr.UnknownValueError:
                        continue
                    except sr.RequestError as e:
                        print(f"Could not request results; {e}")
            except KeyboardInterrupt:
                pass

    def get_analysis(self):
        if not self.speech_data:
            return "No speech data recorded"

        prompt = """
        Based on the speech patterns observed:
        1. Rate the speaking pace
        2. Evaluate voice modulation
        3. Assess clarity and confidence
        4. Provide speaking improvement tips
        """

        return llm.invoke(prompt).content

    def stop_analysis(self):
        self.is_running = False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "type": "error",
            "message": "Please provide role and company as arguments"
        }))
        sys.exit(1)
        
    role = sys.argv[1]
    company = sys.argv[2]
    assistant = InterviewAssistant(role, company)
    asyncio.run(assistant.conduct_interview())