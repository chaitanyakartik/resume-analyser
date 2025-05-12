const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');
const cors = require('cors');
const GeminiModel = require('./constants/geminiModel');
const prompts = require('./constants/prompts');

const app = express();
const PORT = 3000;

// Enable CORS with specific origins
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Allow requests from these origins
    methods: ['GET', 'POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type'], // Allow specific headers
}));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files (e.g., index.html, scripts.js)
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint for resume analysis
app.post('/analyze-resume', upload.single('resumeFile'), async (req, res) => {
  console.log('Received request for /analyze-resume');
  if (!req.file) {
    console.error('No file uploaded.');
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }
  
  const filePath = req.file.path;
  try {
    console.log('Reading file:', filePath);
    const buffer = fs.readFileSync(filePath);
    console.log('File size:', buffer.length, 'bytes');
    
    console.log('Parsing PDF...');
    const pdfData = await pdfParse(buffer);
    console.log('PDF parsed, text length:', pdfData.text.length);
    
    console.log('Calling Gemini model...');
    const model = new GeminiModel();
    const prompt = `${prompts.resumeAnalysisPrompt}\n\n### Resume:\n${pdfData.text}`;
    const result = await model.generate(prompt);
    console.log('Analysis result received, length:', result.length);
    
    console.log('Sending final response...');
    res.json({ success: true, analysis: result });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ success: false, error: 'Internal server error: ' + error.message });
  } finally {
    // Delete uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
