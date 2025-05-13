document.addEventListener('DOMContentLoaded', () => {
    const resumeAnalysisForm = document.getElementById('resumeAnalysisForm');
    const resumeFileInput = document.getElementById('resumeFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageContainer = document.getElementById('errorMessage');
    const analysisResultsWrapper = document.getElementById('analysisResultsWrapper');

    // For overall score
    const overallScoreValueText = document.getElementById('overallScoreValueText');
    const scoreCirclePath = document.getElementById('scoreCirclePath');
    const overallSummaryText = document.getElementById('overallSummaryText');
    
    const detailedParametersContainer = document.getElementById('detailedParametersContainer');
    const generalRecommendationsList = document.getElementById('generalRecommendationsList');

    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', () => {
            fileNameDisplay.textContent = resumeFileInput.files.length > 0 ? resumeFileInput.files[0].name : 'Choose your resume file...';
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
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                displayError('Invalid file type. Please upload a PDF or DOCX file.');
                return;
            }

            showLoading(true);
            clearPreviousResults();
            analysisResultsWrapper.classList.remove('results-fade-in'); // Remove for re-trigger
            try {
                // Show loading message
                showLoading(true, 'Analyzing resume... This may take up to a minute');
                
                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.warn("Aborting due to timeout");
                    controller.abort();
                }, 60000);
                console.log('Timeout set for 60 seconds');
                
                // Get analysis data from backend
                const analysisData = await actualBackendResumeAnalysis(file, controller.signal);
                
                // Clear timeout since we got a response
                clearTimeout(timeoutId);

                // Sanitize and parse the analysis field if it's a string
                const parsedAnalysis = typeof analysisData.analysis === 'string' 
                    ? JSON.parse(analysisData.analysis.replace(/```json|```/g, '').trim()) 
                    : analysisData.analysis;
                
                // saveAnalysisToLocalFile(parsedAnalysis); // Save analysis to local file

                displayAnalysisResults(parsedAnalysis);

                // Add class after a slight delay to ensure elements are in DOM for transition
                setTimeout(() => {
                    analysisResultsWrapper.classList.add('results-fade-in');
                }, 10);
            } catch (error) {
                // Special handling for timeout errors
                if (error.name === 'AbortError') {
                    displayError('Request timed out. The analysis is taking longer than expected.');
                } else {
                    displayError(error.message || 'An unexpected error occurred during analysis.');
                }
            } finally {
                showLoading(false);
            }
        });
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        if(isLoading) { // Only hide these if loading
            analysisResultsWrapper.style.display = 'none';
            errorMessageContainer.style.display = 'none';
        }
    }

    function displayError(message) {
        errorMessageContainer.textContent = message;
        errorMessageContainer.style.display = 'block';
        analysisResultsWrapper.style.display = 'none';

        // Prevent immediate reset by ensuring the error message persists
        setTimeout(() => {
            errorMessageContainer.style.opacity = '1'; // Ensure visibility
        }, 0);
    }

    function clearPreviousResults() {
        errorMessageContainer.style.display = 'none';
        if(overallScoreValueText) overallScoreValueText.textContent = '0.0';
        if(scoreCirclePath) scoreCirclePath.setAttribute('stroke-dasharray', '0, 100');
        overallSummaryText.textContent = '';
        detailedParametersContainer.innerHTML = '';
        generalRecommendationsList.innerHTML = '';
    }

    async function actualBackendResumeAnalysis(file, signal) {
        const formData = new FormData();
        formData.append('resumeFile', file);
        
        try {
            console.log('Sending request to backend...');
            
            const response = await fetch('http://localhost:3000/analyze-resume', {
                method: 'POST',
                body: formData,
                signal: signal // Add the signal here
            });

            console.log('Received response from backend:', response);
            
            if (!response.ok) {
                const errorDetails = await response.text();
                console.error('Backend error details:', errorDetails);
                throw new Error('Failed to analyze resume. Please try again later.');
            }
            console.log('Parsing JSON response...');
            return await response.json();
        } catch (error) {
            console.error('Error connecting to backend:', error);
            
            // Pass the AbortError up to the caller
            if (error.name === 'AbortError') {
                throw error;
            }
            
            throw new Error('Could not connect to the server. Please ensure the server is running and accessible.');
        }
    }

    function displayAnalysisResults(analysis) {
        // Define the CONFIG object
        const CONFIG = {
            colors: {
                excellent: '#28a745', // Green
                good: '#ffc107',      // Yellow
                needsImprovement: '#dc3545', // Red
                neutralText: '#333', // For general text
                iconDefault: '#555'
            },
            scoreThresholds: {
                excellent: 8,
                good: 6
            },
            icons: {
                defaultParam: 'fa-file-alt',
                keyword: 'fa-tags',
                'action verb': 'fa-rocket',
                clarity: 'fa-glasses',
                structure: 'fa-sitemap',
                quantification: 'fa-chart-pie',
                findingsHeader: 'fa-search-plus',
                recommendationsHeader: 'fa-magic',
                findingItem: 'fa-times-circle',
                recommendationItem: 'fa-check-circle',
                generalRecommendation: 'fa-star'
            },
            overallScoreSVGCircumference: 2 * Math.PI * 15.9155 // Radius from original SVG path comment
        };

        // Define the getScoreAttributes function
        function getScoreAttributes(score) {
            if (score >= CONFIG.scoreThresholds.excellent) {
                return {
                    color: CONFIG.colors.excellent,
                    classSuffix: 'excellent',
                    label: 'Excellent'
                };
            } else if (score >= CONFIG.scoreThresholds.good) {
                return {
                    color: CONFIG.colors.good,
                    classSuffix: 'good',
                    label: 'Good'
                };
            } else {
                return {
                    color: CONFIG.colors.needsImprovement,
                    classSuffix: 'needs-improvement',
                    label: 'Needs Improvement'
                };
            }
        }

        // Overall Score (Circular Progress)
        const overallScore = typeof analysis.overallScore === 'number' ? analysis.overallScore : 0; // Default to 0 if undefined
        const overallScoreAttrs = getScoreAttributes(overallScore);

        overallScoreValueText.textContent = overallScore.toFixed(1);
        overallScoreValueText.style.color = overallScoreAttrs.color;

        const scorePercentage = (overallScore / 10) * 100;
        const strokeDashArray = `${(scorePercentage * CONFIG.overallScoreSVGCircumference) / 100}, ${CONFIG.overallScoreSVGCircumference}`;
        scoreCirclePath.setAttribute('stroke-dasharray', strokeDashArray);
        scoreCirclePath.style.stroke = overallScoreAttrs.color;

        // Overall Summary
        overallSummaryText.textContent = analysis.overallSummary || '';

        // Detailed Parameters
        detailedParametersContainer.innerHTML = ''; // Clear previous content
        const analysisParameters = Array.isArray(analysis.analysisParameters) ? analysis.analysisParameters : [];
        analysisParameters.forEach(param => {
            const paramScore = typeof param.score === 'number' ? param.score : 0; // Default to 0 if undefined
            const paramCardElement = createDetailedParamCard({ ...param, score: paramScore });
            detailedParametersContainer.appendChild(paramCardElement);
        });

        // General Recommendations
        generalRecommendationsList.innerHTML = ''; // Clear previous content
        const generalRecommendations = Array.isArray(analysis.generalRecommendations) ? analysis.generalRecommendations : [];
        generalRecommendations.forEach(rec => {
            const listItem = document.createElement('li');
            listItem.className = 'general-recommendations__item';
            listItem.innerHTML = `<i class="fas ${CONFIG.icons.generalRecommendation} general-recommendations__icon" aria-hidden="true"></i> ${rec}`;
            generalRecommendationsList.appendChild(listItem);
        });

        // Ensure the results wrapper is visible
        analysisResultsWrapper.style.display = 'block';
        errorMessageContainer.style.display = 'none';
    }

    // Function to save analysis data to a local JSON file
    function saveAnalysisToLocalFile(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analysis.json';
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Function to read analysis data from a local JSON file
    function readAnalysisFromLocalFile(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                displayError('No file selected.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    callback(data);
                } catch (error) {
                    displayError('Failed to parse JSON file.');
                }
            };
            reader.readAsText(file);
        });

        // Trigger the file input dialog
        input.click();
    }

    function createDetailedParamCard(param) {
        const CONFIG = {
            colors: {
                excellent: '#28a745', // Green
                good: '#ffc107',      // Yellow
                needsImprovement: '#dc3545', // Red
            },
            scoreThresholds: {
                excellent: 8,
                good: 6
            },
            icons: {
                defaultParam: 'fa-file-alt',
                keyword: 'fa-tags',
                'action verb': 'fa-rocket',
                clarity: 'fa-glasses',
                structure: 'fa-sitemap',
                quantification: 'fa-chart-pie'
            }
        };

        // Determine score attributes
        function getScoreAttributes(score) {
            if (score >= CONFIG.scoreThresholds.excellent) {
                return {
                    color: CONFIG.colors.excellent,
                    label: 'Excellent'
                };
            } else if (score >= CONFIG.scoreThresholds.good) {
                return {
                    color: CONFIG.colors.good,
                    label: 'Good'
                };
            } else {
                return {
                    color: CONFIG.colors.needsImprovement,
                    label: 'Needs Improvement'
                };
            }
        }

        const scoreAttrs = getScoreAttributes(param.score);

        // Create card container
        const card = document.createElement('div');
        card.className = 'detailed-param-card';

        // Add icon
        const icon = document.createElement('i');
        icon.className = `fas ${CONFIG.icons[param.type] || CONFIG.icons.defaultParam} detailed-param-card__icon`;
        icon.style.color = scoreAttrs.color;
        card.appendChild(icon);

        // Add title
        const title = document.createElement('h3');
        title.className = 'detailed-param-card__title';
        title.textContent = param.parameterName || 'Unnamed Parameter';
        card.appendChild(title);

        // Add score
        const score = document.createElement('p');
        score.className = 'detailed-param-card__score';
        score.textContent = `Score: ${param.score.toFixed(1)} (${scoreAttrs.label})`;
        score.style.color = scoreAttrs.color;
        card.appendChild(score);

        // Add findings
        if (Array.isArray(param.findings) && param.findings.length > 0) {
            const findingsList = document.createElement('ul');
            findingsList.className = 'detailed-param-card__findings';
            param.findings.forEach(finding => {
                const listItem = document.createElement('li');
                listItem.textContent = finding;
                findingsList.appendChild(listItem);
            });
            card.appendChild(findingsList);
        }

        // Add recommendations
        if (Array.isArray(param.recommendations) && param.recommendations.length > 0) {
            const recommendationsList = document.createElement('ul');
            recommendationsList.className = 'detailed-param-card__recommendations';
            param.recommendations.forEach(recommendation => {
                const listItem = document.createElement('li');
                listItem.textContent = recommendation;
                recommendationsList.appendChild(listItem);
            });
            card.appendChild(recommendationsList);
        }

        return card;
    }
});