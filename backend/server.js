// Requiring libraries
const express = require("express");
const app = express();
const userSchema = require("./models/user.js");
const resultSchema = require("./models/result.js");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { spawn } = require("child_process");
const { handleUpload } = require("./cloudOperations.js");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// MongoDB Atlas connection string
const uri = process.env.MONGO_URL;

mongoose.connect(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}
).catch(() => console.error("Unable to connect to DB"));

mongoose.connection.on("connected", () => { console.log("Connected to Atlas") });

// Session configuration
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 3 * 24 * 60 * 60 * 1000,
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(session(sessionOptions));

// User authorization middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    userSchema.authenticate()
  )
);

passport.serializeUser(userSchema.serializeUser());
passport.deserializeUser(userSchema.deserializeUser());

// Authentication routes

app.post("/signup", async (req, res) => {
  try {
    let { email, password, username } = req.body;
    console.log(email, password, username);

    mongoose.connection.once("close", () => {
      console.log("not Connected to MongoDB Atlas!");
    });

    let newUser = new userSchema({ email, username });

    // Register the user using passport-local-mongoose's register method
    const registeredUser = await userSchema.register(newUser, password);
    const id = registeredUser._id
    return res.json({ id });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    res.status(500).json({ message: "Error creating user" });
  }
});

// Login route
app.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      return res.status(401).json({ message: info || "Invalid credentials" });
    }

    req.logIn(user, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      const userData = user._id;
      res.status(200).json({ message: "Login was successful", id: userData });
    });
  })(req, res, next);
});

// Client pages
app.get("/incepto/:id", async (req, res) => {
  const users = await userSchema.findOne({ _id: req.params.id });
  let allResults = [];
  if (users.results) {
    for (let result of users.results) {
      allResults.push(await resultSchema.findById(`${result}`));
    }
  }
  res.json(allResults);
});

// Run interview route
app.post("/run-interview", async (req, res) => {
  const { role, company } = req.body;
  const pythonPath = "./mlServices/venv/Scripts/python.exe";

  try {
    console.log("Received request:", req.body);

    const pythonProcess = spawn(pythonPath, ["./mlServices/interview_assistant.py", role, company]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python stdout: ${data.toString()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python stderr: ${data.toString()}`);
    });

    pythonProcess.on("close", async (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code === 0) {
        res.json({ isComplete: 1 });
      } else {
        res.status(500).send("Python script did not execute successfully");
      }
    });
  } catch (e) {
    console.error("An error occurred:", e);
    res.status(500).send("Internal server error");
  }
});

// Send questions route
app.post("/questions", (req, res) => {
  fs.readFile("./tempFiles/question.json", "utf-8", (err, content) => {
    if (err) {
      console.error("Error reading the file:", err);
      return res.status(500).json({ error: "Failed to read the questions file" });
    }

    if (!content || content.trim() === "") {
      return res.json([]); // Send empty data if the file is empty
    }

    try {
      const data = JSON.parse(content);
      const recent=data.length;
      return res.json({data,recent});
    } catch (parseError) {
      console.error("Error parsing JSON content:", parseError);
      return res.status(500).json({ error: "Invalid JSON format in the file" });
    }
  });
});

app.post("/save-confidence", async (req, res) => {
  const { avgConfidence,userId, role } = req.body;
  const feedbackPath = path.join(__dirname, "uploads", "feedback.json");

  try {
    // Read existing feedback data
    let feedbackData = [{}];
    if (fs.existsSync(feedbackPath)) {
      feedbackData = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
      feedbackData.emotional_analysis = "";
    }

    // Create prompt for confidence evaluation
    const prompt = `
      Evaluate this interview confidence score:
      Confidence Level: ${avgConfidence}/1

      Provide:
      1. Brief assessment of the confidence level
      2. One key suggestion for improvement if needed
    `;

    // Get evaluation from Gemini
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const evaluation = await model.generateContent(prompt);
    const evaluationText = evaluation.response.text();

    // Add the new confidence data and evaluation
    feedbackData.emotional_analysis={
      confidenceScore: `You had an average confidence of ${avgConfidence*10} out of 10 during the interview (May include 0 if the face is not detected)`,
      evaluation: evaluationText
    };

    // Save updated feedback data
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbackData, null, 2));

    // Upload to Firebase and save to MongoDB
    const { url } = await handleUpload(feedbackPath);

    const interviewResult = new resultSchema({
      url: url,
      date: new Date(),
      topic: role,
      confidenceScore: avgConfidence
    });

    const savedResult = await interviewResult.save();

    // Update user's results if user is logged in
    if (userId) {
      await userSchema.findByIdAndUpdate(
        userId,
        { $push: { results: savedResult._id } },
        { new: true }
      );
    }

    res.status(200).json({ 
      message: "Confidence evaluation saved successfully",
      resultId: savedResult._id
    });

  } catch (error) {
    console.error("Error processing confidence data:", error);
    res.status(500).json({ 
      message: "Failed to process confidence data",
      error: error.message 
    });
  }
});


// Result page route
app.post("/interview-result/:userid/:resultId", async (req, res) => {
  const id = req.params.resultId;
  const resultData = await resultSchema.findById(id);
  const url = resultData.url;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textContent = await response.json();
    res.json(textContent);
  } catch (error) {
    console.error('Error fetching file content:', error);
  }
});

// Setting localhost
const port = 8080;

app.listen(port, (req, res) => {
  console.log(`Connected to ${port}`);
});
