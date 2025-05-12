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
                
                // Modify the actualBackendResumeAnalysis function call to accept the signal
                const analysisData = await actualBackendResumeAnalysis(file, controller.signal);
                
                // Clear timeout since we got a response
                clearTimeout(timeoutId);
                
                // Display results
                displayAnalysisResults(analysisData);
                
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
                // signal: signal // Add the signal here
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

    function displayAnalysisResults(data) {
        // --- Start of Inner Helper Functions ---

        /**
         * Configuration for visual elements and parameters.
         * This could be an external object or defined here.
         */
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
                // Parameter specific icons
                defaultParam: 'fa-file-alt',
                keyword: 'fa-tags',
                'action verb': 'fa-rocket',
                clarity: 'fa-glasses',
                structure: 'fa-sitemap',
                quantification: 'fa-chart-pie',
                // UI element icons
                findingsHeader: 'fa-search-plus',
                recommendationsHeader: 'fa-magic',
                findingItem: 'fa-times-circle', // Suggests a problem
                recommendationItem: 'fa-check-circle', // Suggests a solution
                generalRecommendation: 'fa-star'
            },
            overallScoreSVGCircumference: 2 * Math.PI * 15.9155 // Radius from original SVG path comment
        };

        /**
         * Gets styling attributes based on a score.
         * @param {number} score - The numerical score.
         * @returns {object} { color: string, classSuffix: string, label: string }
         */
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

        /**
         * Gets the specific Font Awesome icon class for a parameter name.
         * @param {string} paramName - The name of the parameter.
         * @returns {string} The Font Awesome icon class.
         */
        function getParamSpecificIcon(paramName) {
            const pNameLower = paramName.toLowerCase();
            for (const keyword in CONFIG.icons) {
                // Check if it's a parameter keyword and not a generic UI icon keyword
                if (keyword !== 'defaultParam' && keyword !== 'findingsHeader' && /* add other non-param keys */ keyword !== 'generalRecommendation' && pNameLower.includes(keyword)) {
                    return CONFIG.icons[keyword];
                }
            }
            return CONFIG.icons.defaultParam;
        }

        /**
         * Creates the HTML element for a single detailed analysis parameter card.
         * @param {object} paramData - The data for the parameter.
         * @returns {HTMLElement} The parameter card element.
         */
        function createDetailedParamCard(paramData) {
            const card = document.createElement('div');
            const scoreAttrs = getScoreAttributes(paramData.score);
            const paramIconClass = getParamSpecificIcon(paramData.parameterName);
            const statusText = paramData.status || scoreAttrs.label; // Use provided status or default label

            card.className = `parameter-card parameter-card--${scoreAttrs.classSuffix}`;
            // CSS variable can be used for the border for more flexibility
            card.style.setProperty('--status-color', scoreAttrs.color);
            // Or, stick to direct style if simpler for your setup:
            // card.style.borderLeft = `5px solid ${scoreAttrs.color}`;

            card.innerHTML = `
                <div class="parameter-card__header">
                    <i class="fas ${paramIconClass} parameter-card__title-icon" aria-hidden="true"></i>
                    <h4 class="parameter-card__name">${paramData.parameterName}</h4>
                </div>
                <div class="parameter-card__score-info">
                    <div class="parameter-card__score-visual">
                        <div class="mini-score-bar">
                            <div class="mini-score-bar__fill mini-score-bar__fill--${scoreAttrs.classSuffix}" style="width: ${paramData.score * 10}%; background-color: ${scoreAttrs.color};"></div>
                        </div>
                        <span class="parameter-card__score-text">${paramData.score.toFixed(1)}/10</span>
                    </div>
                    <span class="parameter-card__status parameter-card__status--${scoreAttrs.classSuffix}">${statusText}</span>
                </div>
                <div class="parameter-card__details">
                    <h5 class="parameter-card__details-heading">
                        <i class="fas ${CONFIG.icons.findingsHeader}" aria-hidden="true"></i> Findings:
                    </h5>
                    <ul class="parameter-card__list findings-list">
                        ${paramData.findings.map(finding => `
                            <li class="findings-list__item">
                                <i class="fas ${CONFIG.icons.findingItem} findings-list__icon findings-list__icon--negative" aria-hidden="true"></i>
                                ${finding}
                            </li>`).join('')}
                    </ul>
                    <h5 class="parameter-card__details-heading">
                        <i class="fas ${CONFIG.icons.recommendationsHeader}" aria-hidden="true"></i> Recommendations:
                    </h5>
                    <ul class="parameter-card__list recommendations-list">
                        ${paramData.recommendations.map(rec => `
                            <li class="recommendations-list__item">
                                <i class="fas ${CONFIG.icons.recommendationItem} recommendations-list__icon recommendations-list__icon--positive" aria-hidden="true"></i>
                                ${rec}
                            </li>`).join('')}
                    </ul>
                </div>
            `;
            return card;
        }

        if (!analysisResultsWrapper || !errorMessageContainer || !overallScoreValueText || !scoreCirclePath || !overallSummaryText || !detailedParametersContainer || !generalRecommendationsList) {
            console.error("One or more required DOM elements for displayAnalysisResults are missing.");
            return; // Exit if crucial elements are not found
        }

        analysisResultsWrapper.style.display = 'block';
        errorMessageContainer.style.display = 'none';

        // Overall Score (Circular Progress)
        const overallScore = data.overallScore;
        const overallScoreAttrs = getScoreAttributes(overallScore);

        overallScoreValueText.textContent = overallScore.toFixed(1);
        overallScoreValueText.style.color = overallScoreAttrs.color; // Optional: color the text too

        const scorePercentage = (overallScore / 10) * 100;
        const strokeDashArray = `${(scorePercentage * CONFIG.overallScoreSVGCircumference) / 100}, ${CONFIG.overallScoreSVGCircumference}`;
        scoreCirclePath.setAttribute('stroke-dasharray', strokeDashArray);
        scoreCirclePath.style.stroke = overallScoreAttrs.color;

        // Overall Summary
        overallSummaryText.textContent = data.overallSummary;

        // Detailed Parameters
        detailedParametersContainer.innerHTML = ''; // Clear previous content
        data.analysisParameters.forEach(param => {
            const paramCardElement = createDetailedParamCard(param);
            detailedParametersContainer.appendChild(paramCardElement);
        });

        // General Recommendations
        generalRecommendationsList.innerHTML = ''; // Clear previous content
        data.generalRecommendations.forEach(rec => {
            const listItem = document.createElement('li');
            listItem.className = 'general-recommendations__item';
            // Using a more descriptive class for the icon color, e.g., 'icon--highlight'
            listItem.innerHTML = `<i class="fas ${CONFIG.icons.generalRecommendation} general-recommendations__icon" aria-hidden="true"></i> ${rec}`;
            generalRecommendationsList.appendChild(listItem);
        });
    }
});