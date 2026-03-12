document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let tags = [];
    let currentRecommendations = [];
    let selectedForComparison = [];
    let searchHistory = [];
    let totalRuns = 0;
    let currentUser = null; // { username, balance }

    // --- DOM Elements ---
    // App
    const skillInput = document.getElementById('skill-input');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsContainer = document.getElementById('tags-container');
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            // Change icon if needed
            const isOpened = mainNav.classList.contains('active');
            mobileMenuBtn.innerHTML = isOpened
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        });

        // Close menu when clicking a link
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileMenuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            });
        });
    }

    const analyzeBtn = document.getElementById('analyze-btn');
    const analyzeSpinner = document.getElementById('analyze-spinner');
    const btnText = analyzeBtn.querySelector('span');

    const resultsContainer = document.getElementById('results-container');
    const careersGrid = document.getElementById('careers-grid');

    // Navigation
    const navLinks = document.querySelectorAll('nav a');
    const viewSections = document.querySelectorAll('.view-section');

    // Chart Instance
    let comparisonChartInstance = null;

    // --- Storage ---
    function saveUserData() {
        const dataToSave = { tags, currentRecommendations, searchHistory, totalRuns };
        localStorage.setItem('pathfinder_data', JSON.stringify(dataToSave));
    }

    function loadUserData() {
        const data = localStorage.getItem('pathfinder_data');
        if (data) {
            const parsed = JSON.parse(data);
            tags = parsed.tags || [];
            currentRecommendations = parsed.currentRecommendations || [];
            searchHistory = parsed.searchHistory || [];
            totalRuns = parsed.totalRuns || 0;

            renderTags();
            if (currentRecommendations.length > 0) {
                renderRecommendations(currentRecommendations);
                if (analyzeBtn) analyzeBtn.disabled = false;
            } else {
                if (analyzeBtn) analyzeBtn.disabled = tags.length === 0;
            }
        } else {
            tags = [];
            currentRecommendations = [];
            selectedForComparison = [];
            searchHistory = [];
            totalRuns = 0;
            renderTags();
            if (resultsContainer) resultsContainer.classList.add('hidden');
            if (analyzeBtn) analyzeBtn.disabled = true;
        }
    }

    // Global Constants
    const trendingJobsContainer = document.getElementById('trending-jobs-container');

    // Initialize App
    async function init() {
        await checkSession(); // Enforce Auth Guard first

        loadUserData();
        setupChartDefaultStyles();
        renderTags();
        renderResourcesView();
        renderCompareSelector();
        renderTrendingJobs();

        if (tags.length > 0) {
            analyzeBtn.disabled = false;
        }
    }

    function renderTrendingJobs() {
        if (!trendingJobsContainer) return;

        // Sort by demand score then salary score to find "Trending & High Paying"
        const trendingCareers = [...careers].sort((a, b) => {
            if (b.stats.demandScore !== a.stats.demandScore) {
                return b.stats.demandScore - a.stats.demandScore;
            }
            return b.stats.salaryScore - a.stats.salaryScore;
        }).slice(0, 6);

        trendingJobsContainer.innerHTML = '';
        trendingCareers.forEach(career => {
            const el = document.createElement('div');
            el.className = 'glass-card';
            el.style.padding = '16px';
            el.style.borderLeft = '3px solid var(--primary-color)';

            el.innerHTML = `
                <div style="font-weight: 60_0; font-size: 1.05rem; margin-bottom: 4px;">${career.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">${career.category}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <span style="color: var(--accent-light);">🔥 High Demand</span>
                    <span style="font-weight: 600;">${career.salaryRange}</span>
                </div>
            `;
            trendingJobsContainer.appendChild(el);
        });
    }

    // Navigation Logic
    function switchView(targetId) {
        viewSections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        });

        // Populate views if needed
        if (targetId === 'compare-section') renderCompareSelector();
        if (targetId === 'resources-section') renderResourcesView();
        if (targetId === 'roadmap-section') renderRoadmapPageView();
        if (targetId === 'profile-section') fetchProfileData();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1) + '-section';

            // Update links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            switchView(targetId);
        });
    });

    // --- Tag Input Logic ---
    function addTag(value) {
        const tagText = value.trim();
        if (tagText && !tags.includes(tagText.toLowerCase())) {
            tags.push(tagText.toLowerCase());
            renderTags();
            skillInput.value = '';
            analyzeBtn.disabled = tags.length === 0;
            saveUserData();
        }
    }

    function removeTag(tagText) {
        tags = tags.filter(t => t !== tagText);
        renderTags();
        analyzeBtn.disabled = tags.length === 0;
        saveUserData();
    }

    function renderTags() {
        tagsContainer.innerHTML = '';
        tags.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'tag';
            el.innerHTML = `
                ${tag}
                <span class="tag-remove" aria-label="Remove tag">✕</span>
            `;
            el.querySelector('.tag-remove').addEventListener('click', () => removeTag(tag));
            tagsContainer.appendChild(el);
        });
    }

    if (skillInput) {
        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTag(skillInput.value);
        });
    }

    if (addTagBtn) {
        addTagBtn.addEventListener('click', () => addTag(skillInput.value));
    }

    // --- API Interactions ---

    // 1. Analyze Skills
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            if (tags.length === 0) return;

            // UI Loading State (Simulating "AI" processing)
            analyzeBtn.disabled = true;
            btnText.textContent = "Analyzing Profile...";
            analyzeSpinner.classList.remove('hidden');
            resultsContainer.classList.add('hidden');

            try {
                // Artificial delay for UI effect
                await new Promise(r => setTimeout(r, 1500));

                const userProfile = [...tags]; // tags are already lowercased

                // Calculate match score for each career directly
                const recommendations = careers.map(career => {
                    const careerKeywords = [...career.skillsRequired.map(s => s.toLowerCase()), ...career.relatedInterests.map(i => i.toLowerCase())];

                    let matchCount = 0;
                    userProfile.forEach(kw => {
                        if (careerKeywords.some(ck => ck.includes(kw) || kw.includes(ck))) {
                            matchCount++;
                        }
                    });

                    const maxPossibleMatches = Math.min(userProfile.length, careerKeywords.length) || 1;
                    let matchScore = Math.floor((matchCount / maxPossibleMatches) * 100);

                    if (matchCount > 0) matchScore = Math.min(98, matchScore + 15);

                    return {
                        ...career,
                        matchCount,
                        matchScore
                    };
                }).filter(career => career.matchCount > 0);

                recommendations.sort((a, b) => b.matchScore - a.matchScore);
                currentRecommendations = recommendations.slice(0, 5);

                renderRecommendations(currentRecommendations);

                // Record History
                totalRuns++;
                searchHistory.unshift({
                    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                    tags: [...tags],
                    topMatches: currentRecommendations.slice(0, 3).map(r => r.title)
                });
                // Keep only last 10
                if (searchHistory.length > 10) searchHistory.pop();

                // Save state after analysis
                saveUserData();

                // Reset Compare selection when new analysis runs
                selectedForComparison = [];

            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
                alert("Error connecting to the AI engine. Is the server running?");
            } finally {
                // Restore UI
                analyzeBtn.disabled = false;
                btnText.textContent = "Analyze Career Matrix";
                analyzeSpinner.classList.add('hidden');
            }
        });
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-high';
        if (score >= 50) return 'score-med';
        return 'score-low';
    }

    function renderRecommendations(careersList) {
        careersGrid.innerHTML = '';

        if (careersList.length === 0) {
            careersGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
                    <span>No exact career matches found</span>
                    <span style="font-size: 0.9rem; opacity: 0.7; margin-top: 8px; display: block;">Try adding more general skills or interests to broaden your search.</span>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        careersList.forEach((career, index) => {
            const card = document.createElement('div');
            card.className = 'career-card';
            // Staggered animation
            card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;
            card.style.opacity = '0';

            const scoreClass = getScoreClass(career.matchScore);

            // Map the resources to link elements
            const careerResources = resources[career.id] || [];
            // Take the first 4 resources to keep the card compact
            const resourceLinksHTML = careerResources.slice(0, 4).map(res => {
                if (res.isInternal && res.steps) {
                    return `<button onclick="window.goToRoadmap('${career.id}')" class="resource-pill ${res.type.toLowerCase()}-pill">
                                <span class="resource-icon">🗺️</span>
                                Interactive Roadmap
                            </button>`;
                }
                return `<a href="${res.link}" target="_blank" class="resource-pill ${res.type.toLowerCase()}-pill">
                    <span class="resource-icon">${res.type === 'Course' ? '🎓' : res.type === 'Book' ? '📚' : res.type === 'Roadmap' ? '🗺️' : '🏆'}</span>
                    ${res.platform}
                </a>`;
            }).join('');

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="career-category">${career.category}</div>
                        <div class="career-title">${career.title}</div>
                    </div>
                    <div class="match-ring ${scoreClass}">
                        ${career.matchScore}%
                    </div>
                </div>
                <div class="career-desc">${career.description}</div>
                <div class="career-meta">
                    <span class="meta-tag">💼 ${career.salaryRange.split(' - ')[0]}</span>
                    <span class="meta-tag">📈 ${career.growthPotential} Growth</span>
                </div>
                <!-- Inline Resources -->
                <div class="career-inline-resources" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Actionable Learning Paths:</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${resourceLinksHTML}
                    </div>
                </div>
            `;
            careersGrid.appendChild(card);
        });

        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Compare Functionality ---
    const compareSelector = document.getElementById('compare-selector');
    const compareBtn = document.getElementById('compare-btn');
    const compareDashboard = document.getElementById('comparison-dashboard');
    const compareSearchInput = document.getElementById('compare-search-input');
    const compareAutocompleteList = document.getElementById('compare-autocomplete-list');

    function renderCompareSelector() {
        compareSelector.innerHTML = '';

        if (selectedForComparison.length === 0) {
            compareSelector.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.9em;">No careers selected. Search above to add.</span>';
        } else {
            selectedForComparison.forEach(id => {
                const career = careers.find(c => c.id === id);
                if (career) {
                    const tag = document.createElement('div');
                    tag.className = 'tag';
                    tag.innerHTML = `
                        ${career.title}
                        <span class="tag-remove" aria-label="Remove tag">✕</span>
                    `;
                    tag.querySelector('.tag-remove').addEventListener('click', () => {
                        selectedForComparison = selectedForComparison.filter(cId => cId !== id);
                        renderCompareSelector();
                    });
                    compareSelector.appendChild(tag);
                }
            });
        }

        compareBtn.disabled = selectedForComparison.length === 0;
    }

    // Compare Autocomplete Logic
    compareSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        compareAutocompleteList.innerHTML = '';

        if (!val) {
            compareAutocompleteList.classList.add('hidden');
            return;
        }

        // Filter out already selected careers
        const exactMatches = careers.filter(c => c.title.toLowerCase().includes(val) && !selectedForComparison.includes(c.id));

        if (exactMatches.length > 0) {
            compareAutocompleteList.classList.remove('hidden');
            showBlurOverlay(compareSearchInput);
            exactMatches.slice(0, 10).forEach(match => { // Limit to top 10 results
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                item.innerHTML = `<strong>${match.title}</strong> <span style="font-size: 0.8em; color: var(--text-secondary);">(${match.category})</span>`;

                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'rgba(99, 102, 241, 0.1)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

                item.addEventListener('click', () => {
                    if (selectedForComparison.length >= 3) {
                        alert("You can compare a maximum of 3 careers at once.");
                        compareAutocompleteList.classList.add('hidden');
                        return;
                    }
                    selectedForComparison.push(match.id);
                    compareSearchInput.value = '';
                    compareAutocompleteList.classList.add('hidden');
                    renderCompareSelector();
                });

                compareAutocompleteList.appendChild(item);
            });
        } else {
            compareAutocompleteList.classList.add('hidden');
            hideBlurOverlay(compareSearchInput);
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== compareSearchInput && !compareAutocompleteList.contains(e.target)) {
            compareAutocompleteList.classList.add('hidden');
            hideBlurOverlay(compareSearchInput);
        }
    });

    compareBtn.addEventListener('click', async () => {
        if (selectedForComparison.length === 0) return;

        try {
            compareBtn.disabled = true;
            compareBtn.textContent = "Loading Data...";

            const comparisonData = careers.filter(c => selectedForComparison.includes(c.id));
            renderComparisonTable(comparisonData);

        } catch (err) {
            console.error(err);
        } finally {
            compareBtn.disabled = false;
            compareBtn.textContent = "Compare Selected";
        }
    });

    function renderComparisonTable(careers) {
        const headersTr = document.getElementById('compare-headers');
        const bodyTbody = document.getElementById('compare-body');

        // Setup Headers
        headersTr.innerHTML = '<th>Criteria</th>';
        careers.forEach(c => {
            headersTr.innerHTML += `<th><div class="table-title">${c.title}</div><div class="career-category" style="margin-top:4px">${c.category}</div></th>`;
        });

        // Setup Rows
        const rows = [
            { key: 'description', label: 'Overview' },
            { key: 'salaryRange', label: 'Est. Salary' },
            { key: 'workLifeBalance', label: 'Work/Life Balance' },
            { key: 'growthPotential', label: 'Growth Potential' },
            { key: 'skillsRequired', label: 'Core Skills', isArray: true },
            { key: 'relatedInterests', label: 'Interests', isArray: true }
        ];

        bodyTbody.innerHTML = '';
        rows.forEach(row => {
            let tr = `<tr><td>${row.label}</td>`;
            careers.forEach(c => {
                let cellData = c[row.key];
                if (row.isArray) {
                    cellData = cellData.map(item => `<span class="meta-tag" style="display:inline-block; margin:2px;">${item}</span>`).join('');
                }
                tr += `<td>${cellData}</td>`;
            });
            tr += '</tr>';
            bodyTbody.innerHTML += tr;
        });

        // Add custom Action Links row at the bottom
        let actionTr = `<tr><td><strong style="color: var(--accent-glow);">Action Links</strong></td>`;
        careers.forEach(c => {
            actionTr += `
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="window.goToRoadmap('${c.id}')" class="btn-primary" style="padding: 6px 12px; font-size: 0.85rem;">View Roadmap</button>
                        <a href="#resources" onclick="window.goToResources('${c.title.replace(/'/g, "\\'")}'); return false;" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; text-decoration: none;">Learning Resources</a>
                    </div>
                </td>
            `;
        });
        actionTr += '</tr>';
        bodyTbody.innerHTML += actionTr;

        // Render Chart
        renderChart(careers);

        compareDashboard.classList.remove('hidden');
    }

    function renderChart(careers) {
        const ctx = document.getElementById('comparisonChart').getContext('2d');

        // Destroy existing chart if it exists
        if (comparisonChartInstance) {
            comparisonChartInstance.destroy();
        }

        // Colors for up to 3 datasets
        const colors = [
            { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 1)' }, // Indigo primary
            { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 1)' }, // Pink secondary
            { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 1)' }  // Emerald accent
        ];

        const datasets = careers.map((c, idx) => {
            return {
                label: c.title,
                data: [
                    c.stats.salaryScore,
                    c.stats.growthScore,
                    c.stats.demandScore,
                    c.stats.workLifeScore
                ],
                backgroundColor: colors[idx].bg,
                borderColor: colors[idx].border,
                borderWidth: 2,
                pointBackgroundColor: colors[idx].border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors[idx].border
            };
        });

        comparisonChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Salary Potential', 'Growth Potential', 'Market Demand', 'Work/Life Balance'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: '#a0a0b0',
                            font: { family: "'Inter', sans-serif", size: 12 }
                        },
                        ticks: {
                            display: false, // hide numbers on the scale
                            min: 0,
                            max: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff', font: { family: "'Outfit', sans-serif" } }
                    }
                }
            }
        });
    }

    // --- Resources Functionality ---
    const resourcesGrid = document.getElementById('resources-grid');
    const resourceSearchInput = document.getElementById('resource-search-input');
    const resourceAutocompleteList = document.getElementById('resource-autocomplete-list');
    const searchBlurOverlay = document.getElementById('search-blur-overlay');

    function showBlurOverlay(inputEl) {
        if (searchBlurOverlay) {
            searchBlurOverlay.classList.add('active');
        }
    }
    function hideBlurOverlay(inputEl) {
        if (searchBlurOverlay) {
            searchBlurOverlay.classList.remove('active');
        }
    }

    // Autocomplete Logic
    resourceSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        resourceAutocompleteList.innerHTML = '';

        if (!val) {
            resourceAutocompleteList.classList.add('hidden');
            hideBlurOverlay(resourceSearchInput);
            renderResourcesView(); // Reset to default when empty
            return;
        }

        const exactMatches = careers.filter(c => c.title.toLowerCase().includes(val));

        if (exactMatches.length > 0) {
            resourceAutocompleteList.classList.remove('hidden');
            showBlurOverlay(resourceSearchInput);
            exactMatches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                item.innerHTML = `<strong>${match.title}</strong> <span style="font-size: 0.8em; color: var(--text-secondary);">(${match.category})</span>`;

                // Hover effect
                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'rgba(99, 102, 241, 0.1)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

                item.addEventListener('click', () => {
                    resourceSearchInput.value = match.title;
                    resourceAutocompleteList.classList.add('hidden');
                    renderResourcesView([match]); // Render specifically this career
                });

                resourceAutocompleteList.appendChild(item);
            });
        } else {
            resourceAutocompleteList.classList.add('hidden');
            hideBlurOverlay(resourceSearchInput);
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== resourceSearchInput && e.target !== resourceAutocompleteList) {
            resourceAutocompleteList.classList.add('hidden');
            hideBlurOverlay(resourceSearchInput);
        }
    });

    async function renderResourcesView(specificCareers = null) {
        resourcesGrid.innerHTML = '';

        // Use specific careers if searched, otherwise fallback to Top 2 Recommendations, otherwise fallback to Top 3 Default
        let topCareers = specificCareers;
        if (!topCareers) {
            topCareers = currentRecommendations.length > 0 ? currentRecommendations.slice(0, 2) : careers.slice(0, 3);
        }

        for (const career of topCareers) {
            try {
                const careerResources = resources[career.id] || [];

                // Add a section header for the career
                const header = document.createElement('div');
                header.style.gridColumn = "1 / -1";
                header.style.marginTop = "20px";
                header.innerHTML = `<h3 style="color: var(--accent-glow);">${career.title} Pathways</h3>`;
                resourcesGrid.appendChild(header);

                careerResources.forEach((resource, index) => {
                    const card = document.createElement('div');
                    card.className = 'resource-card';
                    card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;
                    card.style.opacity = '0';

                    let linkHtml = `<a href="${resource.link}" class="r-link" target="_blank">Start Learning ↗</a>`;

                    if (resource.isInternal && resource.type === 'Roadmap') {
                        linkHtml = `<a onclick="window.goToRoadmap('${career.id}'); return false;" class="r-link" style="cursor: pointer;">View Roadmap ↗</a>`;
                    }

                    card.innerHTML = `
                        <span class="r-type">${resource.type}</span>
                        <h4 class="r-title">${resource.title}</h4>
                        <div class="r-platform">${resource.platform}</div>
                        ${linkHtml}
                    `;
                    resourcesGrid.appendChild(card);
                });
            } catch (err) {
                console.error(err);
            }
        }
    }

    // --- Roadmap Page Functionality ---
    const roadmapPageGrid = document.getElementById('roadmap-page-grid');
    const roadmapSearchInput = document.getElementById('roadmap-search-input');
    const roadmapAutocompleteList = document.getElementById('roadmap-autocomplete-list');

    // Autocomplete Logic for Roadmap Page
    roadmapSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        roadmapAutocompleteList.innerHTML = '';

        if (!val) {
            roadmapAutocompleteList.classList.add('hidden');
            hideBlurOverlay(roadmapSearchInput);
            renderRoadmapPageView(); // Reset to default when empty
            return;
        }

        const exactMatches = careers.filter(c => c.title.toLowerCase().includes(val));

        if (exactMatches.length > 0) {
            roadmapAutocompleteList.classList.remove('hidden');
            showBlurOverlay(roadmapSearchInput);
            exactMatches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                item.innerHTML = `<strong>${match.title}</strong> <span style="font-size: 0.8em; color: var(--text-secondary);">(${match.category})</span>`;

                // Hover effect
                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'rgba(99, 102, 241, 0.1)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

                item.addEventListener('click', () => {
                    roadmapSearchInput.value = match.title;
                    roadmapAutocompleteList.classList.add('hidden');
                    renderRoadmapPageView([match]); // Render specifically this career
                });

                roadmapAutocompleteList.appendChild(item);
            });
        } else {
            roadmapAutocompleteList.classList.add('hidden');
            hideBlurOverlay(roadmapSearchInput);
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (roadmapSearchInput && e.target !== roadmapSearchInput && e.target !== roadmapAutocompleteList) {
            roadmapAutocompleteList.classList.add('hidden');
            hideBlurOverlay(roadmapSearchInput);
        }
    });

    async function renderRoadmapPageView(specificCareers = null) {
        if (!roadmapPageGrid) return;
        roadmapPageGrid.innerHTML = '';

        // Use specific careers if searched, otherwise fallback to Top 1 Recommendation, otherwise fallback to Top 1 Default
        let topCareers = specificCareers;
        if (!topCareers) {
            topCareers = currentRecommendations.length > 0 ? currentRecommendations.slice(0, 1) : careers.slice(0, 1);
        }

        for (const career of topCareers) {
            try {
                const careerResources = resources[career.id] || [];
                const roadmapData = careerResources.find(r => r.type === 'Roadmap');

                if (!roadmapData) continue;

                // Add a section header for the career
                const header = document.createElement('div');
                header.style.gridColumn = "1 / -1";
                header.style.marginTop = "20px";
                header.innerHTML = `<h3 style="color: var(--accent-glow); margin-bottom: 24px;">${roadmapData.title}</h3>`;
                roadmapPageGrid.appendChild(header);

                // Build the timeline purely in HTML as child of the grid
                const timelineContainer = document.createElement('div');
                timelineContainer.className = 'timeline-container';
                timelineContainer.style.gridColumn = "1 / -1";

                roadmapData.steps.forEach((step, index) => {
                    const stepDiv = document.createElement('div');
                    stepDiv.className = 'timeline-step';

                    const timelineSub = step.day ? `<span class="timeline-day-badge">${step.day}</span>` : `<span>Phase ${index + 1}</span>`;

                    stepDiv.innerHTML = `
                        <div class="timeline-step-title">
                            ${timelineSub}
                            <span>${step.title}</span>
                        </div>
                        <div class="timeline-step-desc">${step.desc}</div>
                    `;
                    timelineContainer.appendChild(stepDiv);
                });

                roadmapPageGrid.appendChild(timelineContainer);

            } catch (err) {
                console.error(err);
            }
        }
    }

    // --- Profile Functionality ---
    function renderProfileView() {
        profileTotalRuns.textContent = totalRuns;

        if (searchHistory.length === 0) {
            searchHistoryContainer.innerHTML = '<div class="empty-state" style="padding: 40px 20px;"><span>No search history found</span></div>';
            return;
        }

        searchHistoryContainer.innerHTML = '';
        searchHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const tagsHtml = item.tags.map(t => `<div class="tag">${t}</div>`).join('');

            div.innerHTML = `
                <div class="history-date">${item.date}</div>
                <div class="history-skills">
                    ${tagsHtml}
                </div>
                <div class="history-results">
                    <strong>Top Matches:</strong> ${item.topMatches.join(' • ')}
                </div>
            `;
            searchHistoryContainer.appendChild(div);
        });
    }

    // --- Interactive Background ---
    function initParticles() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height, particles;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = `rgba(168, 85, 247, ${Math.random() * 0.3})`;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > width || this.x < 0) this.speedX *= -1;
                if (this.y > height || this.y < 0) this.speedY *= -1;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            resize();
            particles = [];
            const count = Math.min(window.innerWidth / 15, 60); // Responsive count
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) {
                p.update();
                p.draw();
            }
            // Draw lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 - dist / 1000})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', init);
        init();
        animate();
    }

    // === AUTH FLOW ===
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const showAuthBtn = document.getElementById('show-auth-btn');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const userInfoDiv = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const balanceDisplay = document.getElementById('balance-display');
    const logoutBtn = document.getElementById('logout-btn');

    function openAuthModal(tab = 'login') {
        authModalOverlay.classList.remove('hidden');
        switchTab(tab);
    }

    function closeModal() {
        if (!currentUser) return; // Enforce Auth Guard: Can't close if not logged in
        authModalOverlay.classList.add('hidden');
        loginError.classList.add('hidden');
        registerError.classList.add('hidden');
        if (closeAuthModal) closeAuthModal.classList.remove('hidden');
        document.body.classList.remove('auth-forced');
    }

    function switchTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    const navProfileLink = document.getElementById('nav-profile-link');

    function updateAuthUI() {
        if (currentUser) {
            showAuthBtn.classList.add('hidden');
            userInfoDiv.classList.remove('hidden');
            usernameDisplay.textContent = '👤 ' + currentUser.username;
            if (navProfileLink) navProfileLink.classList.remove('hidden');
        } else {
            showAuthBtn.classList.remove('hidden');
            userInfoDiv.classList.add('hidden');
            if (navProfileLink) navProfileLink.classList.add('hidden');
        }
    }

    // Check for existing session on load
    async function checkSession() {
        const token = localStorage.getItem('pathfinder_token');
        if (!token) {
            enforceAuthGuard();
            return;
        }
        try {
            const res = await fetch('/api/user/balance', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                currentUser = { username: data.username }; // Balance removed
                updateAuthUI();
                closeModal();
            } else {
                handleFailedSession();
            }
        } catch (e) {
            handleFailedSession();
        }
    }

    function handleFailedSession() {
        localStorage.removeItem('pathfinder_token');
        currentUser = null;
        enforceAuthGuard();
    }

    function enforceAuthGuard() {
        // Enforce the auth guard by opening the modal and hiding the close button
        openAuthModal('login');
        if (closeAuthModal) closeAuthModal.classList.add('hidden');
        document.body.classList.add('auth-forced');
    }

    // Login
    loginSubmitBtn.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        loginError.classList.add('hidden');
        if (!username || !password) { loginError.textContent = 'Please fill in all fields.'; loginError.classList.remove('hidden'); return; }

        loginSubmitBtn.querySelector('span').textContent = 'Signing in...';
        loginSubmitBtn.disabled = true;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('pathfinder_token', data.token);
                currentUser = { username: data.username, balance: data.balance || 0 };
                updateAuthUI();
                closeModal();
            } else {
                loginError.textContent = data.error || data.message || 'Login failed.';
                loginError.classList.remove('hidden');
            }
        } catch (e) {
            loginError.textContent = 'Network error. Is the server running?';
            loginError.classList.remove('hidden');
        } finally {
            loginSubmitBtn.querySelector('span').textContent = 'Sign In';
            loginSubmitBtn.disabled = false;
        }
    });

    // Register
    registerSubmitBtn.addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        registerError.classList.add('hidden');
        if (!username || !password) { registerError.textContent = 'Please fill in all fields.'; registerError.classList.remove('hidden'); return; }

        registerSubmitBtn.querySelector('span').textContent = 'Creating Account...';
        registerSubmitBtn.disabled = true;
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                // Auto-login after registration
                const loginRes = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const loginData = await loginRes.json();
                if (loginRes.ok) {
                    localStorage.setItem('pathfinder_token', loginData.token);
                    currentUser = { username: loginData.username }; // Balance removed
                    updateAuthUI();
                    closeModal();
                }
            } else {
                registerError.textContent = data.error || data.message || 'Registration failed.';
                registerError.classList.remove('hidden');
            }
        } catch (e) {
            registerError.textContent = 'Network error. Is the server running?';
            registerError.classList.remove('hidden');
        } finally {
            registerSubmitBtn.querySelector('span').textContent = 'Create Account';
            registerSubmitBtn.disabled = false;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('pathfinder_token');
        currentUser = null;
        // On logout, force reload the page to seamlessly trigger the Auth Guard again
        window.location.reload();
    });

    // Event listeners
    showAuthBtn.addEventListener('click', () => openAuthModal('login'));
    closeAuthModal.addEventListener('click', closeModal);
    authModalOverlay.addEventListener('click', (e) => { if (e.target === authModalOverlay) closeModal(); });
    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));

    // Roadmap logic
    const roadmapModalOverlay = document.getElementById('roadmap-modal-overlay');
    const closeRoadmapModalBtn = document.getElementById('close-roadmap-modal');
    const roadmapTimeline = document.getElementById('roadmap-timeline');
    const roadmapModalTitle = document.getElementById('roadmap-modal-title');

    window.openRoadmapModal = function (careerId) {
        const career = careers.find(c => c.id === careerId);
        if (!career) return;
        const careerResources = resources[careerId] || [];
        const roadmapData = careerResources.find(r => r.type === 'Roadmap');
        if (!roadmapData) return;

        roadmapModalTitle.textContent = roadmapData.title;
        roadmapTimeline.innerHTML = '';

        roadmapData.steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'timeline-step';

            // Allow for old generic phases or the new 30-day 'day' property
            const timelineSub = step.day ? `<span class="timeline-day-badge">${step.day}</span>` : `<span>Phase ${index + 1}</span>`;

            stepDiv.innerHTML = `
                <div class="timeline-step-title">
                    ${timelineSub}
                    <span>${step.title}</span>
                </div>
                <div class="timeline-step-desc">${step.desc}</div>
            `;
            roadmapTimeline.appendChild(stepDiv);
        });

        if (roadmapModalOverlay) roadmapModalOverlay.classList.remove('hidden');
    };

    function closeRoadmapModal() {
        if (roadmapModalOverlay) roadmapModalOverlay.classList.add('hidden');
    }

    if (closeRoadmapModalBtn) closeRoadmapModalBtn.addEventListener('click', closeRoadmapModal);
    if (roadmapModalOverlay) roadmapModalOverlay.addEventListener('click', (e) => { if (e.target === roadmapModalOverlay) closeRoadmapModal(); });

    window.goToRoadmap = function (careerId) {
        const career = careers.find(c => c.id === careerId);
        if (!career) return;

        navLinks.forEach(l => l.classList.remove('active'));
        const roadmapLink = Array.from(navLinks).find(l => l.getAttribute('href') === '#roadmap');
        if (roadmapLink) roadmapLink.classList.add('active');

        switchView('roadmap-section');
        renderRoadmapPageView([career]);
        window.scrollTo(0, 0);
    };

    window.goToResources = function (careerTitle) {
        // Decode the title in case it had escaped apostrophes from HTML inline usage
        const cleanTitle = careerTitle.replace(/\\'/g, "'");
        const career = careers.find(c => c.title === cleanTitle);
        if (!career) return;

        navLinks.forEach(l => l.classList.remove('active'));
        const resourcesLink = Array.from(navLinks).find(l => l.getAttribute('href') === '#resources');
        if (resourcesLink) resourcesLink.classList.add('active');

        switchView('resources-section');

        const resourceSearchInput = document.getElementById('resource-search-input');
        if (resourceSearchInput) {
            resourceSearchInput.value = career.title;
        }

        // Directly render the target career's resources instead of relying on input events
        renderResourcesView([career]);
        window.scrollTo(0, 0);
    };

    // --- Profile Section Logic ---
    async function fetchProfileData() {
        const token = localStorage.getItem('pathfinder_token');
        if (!token) return;

        try {
            const res = await fetch('/api/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();

                // Populate Form
                let hasData = false;
                if (data.profileDetails) {
                    const nameInput = document.getElementById('profile-name');
                    const roleInput = document.getElementById('profile-role');
                    const locInput = document.getElementById('profile-location');

                    nameInput.value = data.profileDetails.name || '';
                    roleInput.value = data.profileDetails.role || '';
                    locInput.value = data.profileDetails.location || '';

                    if (nameInput.value || roleInput.value || locInput.value) {
                        hasData = true;
                    }
                }

                // Toggle Edit State
                const editBtn = document.getElementById('edit-profile-btn');
                const saveBtn = document.getElementById('save-profile-btn');
                const inputs = [document.getElementById('profile-name'), document.getElementById('profile-role'), document.getElementById('profile-location')];

                if (hasData) {
                    inputs.forEach(i => i.disabled = true);
                    editBtn.style.display = 'block';
                    saveBtn.style.display = 'none';
                } else {
                    inputs.forEach(i => i.disabled = false);
                    editBtn.style.display = 'none';
                    saveBtn.style.display = 'block';
                }

                // Populate History Tags
                const historyContainer = document.getElementById('profile-history-container');
                historyContainer.innerHTML = '';

                if (data.searchHistory && data.searchHistory.length > 0) {
                    data.searchHistory.forEach(tagText => {
                        const tag = document.createElement('span');
                        tag.className = 'meta-tag';
                        tag.textContent = tagText;
                        historyContainer.appendChild(tag);
                    });
                } else {
                    historyContainer.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.9rem;">No search history yet.</span>';
                }
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    }

    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('pathfinder_token');
            if (!token) return;

            const name = document.getElementById('profile-name').value.trim();
            const role = document.getElementById('profile-role').value.trim();
            const location = document.getElementById('profile-location').value.trim();

            saveProfileBtn.querySelector('span').textContent = 'Saving...';

            try {
                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        profileDetails: { name, role, location }
                    })
                });

                const msg = document.getElementById('profile-save-message');
                if (res.ok) {
                    msg.textContent = 'Saved successfully!';
                    msg.style.color = '#10b981';
                    msg.style.display = 'block';
                    setTimeout(() => msg.style.display = 'none', 3000);

                    // Re-disable form after save
                    const inputs = [document.getElementById('profile-name'), document.getElementById('profile-role'), document.getElementById('profile-location')];
                    inputs.forEach(i => i.disabled = true);
                    document.getElementById('edit-profile-btn').style.display = 'block';
                    saveProfileBtn.style.display = 'none';
                } else {
                    // Visibly show the user the fetch failure
                    msg.textContent = 'Failed to save! Please make sure you have restarted your server.';
                    msg.style.color = '#ef4444';
                    msg.style.display = 'block';
                }
            } catch (e) {
                console.error("Failed to save profile", e);
                const msg = document.getElementById('profile-save-message');
                msg.textContent = 'Network error! Please make sure the server is running.';
                msg.style.color = '#ef4444';
                msg.style.display = 'block';
            } finally {
                saveProfileBtn.querySelector('span').textContent = 'Save Details';
            }
        });
    }

    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const inputs = [document.getElementById('profile-name'), document.getElementById('profile-role'), document.getElementById('profile-location')];
            inputs.forEach(i => i.disabled = false);
            editProfileBtn.style.display = 'none';
            document.getElementById('save-profile-btn').style.display = 'block';
        });
    }

    // Initialize
    initParticles();
    checkSession();
    init();
});
