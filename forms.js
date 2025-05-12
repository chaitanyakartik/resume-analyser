document.addEventListener('DOMContentLoaded', () => {
    const resumeAnalysisForm = document.getElementById('resumeAnalysisForm');
    const resumeFileInput = document.getElementById('resumeFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageContainer = document.getElementById('errorMessage');
    const analysisResultsWrapper = document.getElementById('analysisResultsWrapper');

    const overallScoreValue = document.getElementById('overallScoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const overallSummaryText = document.getElementById('overallSummaryText');
    const detailedParametersContainer = document.getElementById('detailedParametersContainer');
    const generalRecommendationsList = document.getElementById('generalRecommendationsList');

    // Update file name display on file selection
    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', () => {
            if (resumeFileInput.files.length > 0) {
                fileNameDisplay.textContent = resumeFileInput.files[0].name;
            } else {
                fileNameDisplay.textContent = 'Choose your resume file...';
            }
        });
    }

    if (resumeAnalysisForm) {
        resumeAnalysisForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const file = resumeFileInput.files[0];

            if (!file) {
                displayError('Please select a resume file to analyse.');
                return;
            }

            // Validate file type (optional, as 'accept' attribute handles it mostly)
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                displayError('Invalid file type. Please upload a PDF or DOCX file.');
                return;
            }

            showLoading(true);
            clearPreviousResults();

            try {
                // Simulate calling a function from backend.js
                // In a real app: const analysisData = await backend.analyzeResume(file);
                const analysisData = await mockBackendResumeAnalysis(file);
                displayAnalysisResults(analysisData);
            } catch (error) {
                displayError(error.message || 'An unexpected error occurred during analysis.');
            } finally {
                showLoading(false);
            }
        });
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.style.display = 'flex';
            analysisResultsWrapper.style.display = 'none';
            errorMessageContainer.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }

    function displayError(message) {
        errorMessageContainer.textContent = message;
        errorMessageContainer.style.display = 'block';
        analysisResultsWrapper.style.display = 'none';
    }

    function clearPreviousResults() {
        errorMessageContainer.style.display = 'none';
        overallScoreValue.textContent = 'N/A';
        scoreBar.style.width = '0%';
        overallSummaryText.textContent = '';
        detailedParametersContainer.innerHTML = '';
        generalRecommendationsList.innerHTML = '';
    }

    async function mockBackendResumeAnalysis(file) {
        // This function simulates a call to a backend service.
        // Replace this with your actual backend call.
        console.log(`Simulating analysis for: ${file.name}`);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate a potential random error for testing
                // if (Math.random() < 0.2) {
                //     reject(new Error("Simulated backend error: Analysis failed unexpectedly."));
                //     return;
                // }

                // Return the pre-defined JSON structure
                resolve({
                  "analysisId": `mock_${new Date().getTime()}`,
                  "analysisTimestamp": new Date().toISOString(),
                  "overallScore": 7.8,
                  "overallSummary": "Your resume shows strong potential with excellent clarity and good action verb usage. Significant improvements can be made by optimizing for keywords relevant to your target roles and by quantifying more of your achievements to better showcase their impact.",
                  "analysisParameters": [
                    {
                      "parameterName": "Keyword Relevance & ATS Optimization",
                      "score": 6.5,
                      "status": "Needs Improvement",
                      "findings": [
                        "Resume aligns with some general industry terms but could be better targeted with specific keywords for roles like 'Senior Marketing Manager'.",
                        "The skills section is present but could be more detailed with specific tools and proficiencies."
                      ],
                      "recommendations": [
                        "Research 3-5 job descriptions for your target role and integrate common keywords naturally.",
                        "Enhance your skills section: e.g., 'SEO/SEM (Google Analytics, Ahrefs), Email Marketing (Mailchimp), CRM (Salesforce)'.",
                        "Ensure formatting is ATS-friendly; avoid images or tables for critical information."
                      ]
                    },
                    {
                      "parameterName": "Action Verb Usage & Impact Statements",
                      "score": 8.2,
                      "status": "Good",
                      "findings": [
                        "Effective use of strong action verbs like 'Managed', 'Launched', 'Increased' in most experience bullet points.",
                        "A few bullet points are descriptive of duties rather than direct achievements."
                      ],
                      "recommendations": [
                        "Rephrase any duty-focused points to highlight specific accomplishments and results.",
                        "Ensure every bullet point ideally starts with a varied and impactful action verb."
                      ]
                    },
                    {
                      "parameterName": "Clarity, Conciseness & Readability",
                      "score": 9.0,
                      "status": "Excellent",
                      "findings": [
                        "Content is well-written, professional, and easy to scan.",
                        "Bullet points are concise and effectively convey information."
                      ],
                      "recommendations": [
                        "Maintain this standard. Proofread carefully for any minor errors before submitting."
                      ]
                    },
                    {
                      "parameterName": "Structure & Formatting Consistency",
                      "score": 7.5,
                      "status": "Good",
                      "findings": [
                        "All standard resume sections are included and clearly demarcated.",
                        "Font and date formatting are generally consistent."
                      ],
                      "recommendations": [
                        "Double-check for complete consistency in date formats (e.g., MM/YYYY throughout).",
                        "Ensure adequate white space for visual appeal and readability."
                      ]
                    },
                    {
                      "parameterName": "Quantification of Achievements",
                      "score": 6.0,
                      "status": "Needs Improvement",
                      "findings": [
                        "Some achievements are mentioned, but many lack specific metrics (numbers, percentages, values).",
                        "Impact of actions is not always clearly demonstrated through data."
                      ],
                      "recommendations": [
                        "Quantify achievements wherever possible: e.g., 'Increased lead generation by 25% in Q3' instead of 'Increased lead generation'.",
                        "Use numbers to illustrate the scale of your work: e.g., 'Managed a budget of $500K' or 'Led a team of 10'."
                      ]
                    }
                  ],
                  "generalRecommendations": [
                    "Tailor your resume for each job application, highlighting skills matching the job description.",
                    "Create a compelling professional summary at the top, if not already present.",
                    "Keep your LinkedIn profile updated and aligned with your resume."
                  ]
                });
            }, 2500); // Simulate 2.5 seconds delay
        });
    }

    function displayAnalysisResults(data) {
        analysisResultsWrapper.style.display = 'block';
        errorMessageContainer.style.display = 'none';

        // Overall Score and Summary
        overallScoreValue.textContent = data.overallScore.toFixed(1);
        scoreBar.style.width = `${data.overallScore * 10}%`; // Score out of 10
        overallSummaryText.textContent = data.overallSummary;

        // Detailed Parameters
        detailedParametersContainer.innerHTML = ''; // Clear previous
        data.analysisParameters.forEach(param => {
            const paramCard = document.createElement('div');
            paramCard.className = 'parameter-card';

            let statusClass = '';
            if (param.score >= 8) statusClass = 'status-excellent';
            else if (param.score >= 6) statusClass = 'status-good';
            else statusClass = 'status-needs-improvement';

            paramCard.innerHTML = `
                <h4>${param.parameterName}</h4>
                <div class="param-score-status">
                    <span class="param-score">${param.score.toFixed(1)}/10</span>
                    <span class="param-status ${statusClass}">${param.status}</span>
                </div>
                <h5><i class="fas fa-search"></i> Findings:</h5>
                <ul class="findings-list">
                    ${param.findings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
                <h5><i class="fas fa-wrench"></i> Recommendations:</h5>
                <ul class="recommendations-list">
                    ${param.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            `;
            detailedParametersContainer.appendChild(paramCard);
        });

        // General Recommendations
        generalRecommendationsList.innerHTML = ''; // Clear previous
        data.generalRecommendations.forEach(rec => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<i class="fas fa-check-circle"></i> ${rec}`;
            generalRecommendationsList.appendChild(listItem);
        });
    }
});