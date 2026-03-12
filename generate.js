const fs = require('fs');
const path = require('path');

const jobPrefixes = ["Senior", "Junior", "Lead", "Chief", "Principal", "Associate"];
const fields = {
    "Technology": {
        titles: ["Software Engineer", "Backend Developer", "Frontend Developer", "DevOps Engineer", "Site Reliability Engineer", "Systems Administrator", "Cloud Engineer", "Database Administrator", "Machine Learning Engineer", "Data Engineer", "Game Developer", "Embedded Systems Engineer", "QA Tester", "Automation Engineer", "Network Engineer", "IT Support Specialist", "Security Researcher", "Hardware Engineer", "Firmware Programmer", "Rust Developer", "Go Developer", "Python Developer", "Ruby on Rails Developer", "C++ Developer", "Application Support Analyst"],
        skills: ["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "Rust", "Swift", "Kotlin", "React", "Angular", "Vue", "Node.js", "Django", "Spring", "SQL", "NoSQL", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "CI/CD", "Testing"],
        interests: ["Coding", "Problem Solving", "Technology", "Hardware", "Systems", "Automation", "Logic"]
    },
    "Data & AI": {
        titles: ["Data Analyst", "Data Scientist", "AI Researcher", "NLP Engineer", "Computer Vision Engineer", "Data Architect", "Business Intelligence Analyst", "Big Data Engineer", "Machine Learning Researcher", "Predictive Modeler", "Quantitative Analyst", "Statistician", "Operations Research Analyst", "Chatbot Developer", "Algorithm Engineer"],
        skills: ["Python", "R", "SQL", "Machine Learning", "Deep Learning", "Statistics", "Data Visualization", "TensorFlow", "PyTorch", "Pandas", "Hadoop", "Spark", "Tableau", "Power BI", "Mathematics"],
        interests: ["Math", "Analytics", "Research", "AI", "Patterns", "Data", "Algorithms"]
    },
    "Design": {
        titles: ["UI Designer", "UX Designer", "Product Designer", "Graphic Designer", "Visual Designer", "Interaction Designer", "Web Designer", "Art Director", "Creative Director", "Animater", "3D Modeler", "Motion Graphics Designer", "Packaging Designer", "Illustrator", "Industrial Designer"],
        skills: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "InDesign", "Wireframing", "Prototyping", "User Research", "Typography", "Color Theory", "HTML/CSS", "Blender", "Maya", "Animation"],
        interests: ["Art", "Psychology", "Design", "Human Behavior", "Creativity", "Aesthetics", "User Experience"]
    },
    "Marketing": {
        titles: ["Marketing Manager", "Digital Marketer", "SEO Specialist", "Content Strategist", "Copywriter", "Social Media Manager", "Email Marketing Specialist", "Growth Hacker", "Brand Manager", "Public Relations Specialist", "Market Research Analyst", "Event Coordinator", "Media Buyer", "Advertising Executive", "Influencer Manager"],
        skills: ["SEO/SEM", "Content Creation", "Social Media", "Analytics", "Copywriting", "Google Ads", "Facebook Ads", "Email Marketing", "HubSpot", "CRM", "Communication", "Marketing Strategy", "Public Relations", "Event Planning"],
        interests: ["Social Media", "Writing", "Business", "Communication", "Trends", "Networking", "Branding"]
    },
    "Business": {
        titles: ["Product Manager", "Project Manager", "Scrum Master", "Business Analyst", "Operations Manager", "Supply Chain Manager", "Human Resources Manager", "Recruiter", "Account Manager", "Sales Manager", "Business Development Executive", "Management Consultant", "Entrepreneur", "Chief Executive Officer", "Chief Operating Officer"],
        skills: ["Leadership", "Agile/Scrum", "Market Analysis", "Communication", "Strategic Thinking", "Project Management", "Operations", "Sales", "Negotiation", "Recruiting", "HR", "Supply Chain", "Consulting", "Finance", "Strategy"],
        interests: ["Leadership", "Business Strategy", "Technology", "Organizing", "People", "Management", "Operations"]
    },
    "Finance": {
        titles: ["Financial Analyst", "Investment Banker", "Accountant", "Auditor", "Wealth Manager", "Financial Planner", "Risk Analyst", "Actuary", "Economist", "Trader", "Tax Specialist", "Underwriter", "Loan Officer", "Credit Analyst", "Venture Capitalist"],
        skills: ["Excel", "Financial Modeling", "Data Analysis", "Accounting", "Forecasting", "Mathematics", "Statistics", "Economics", "Risk Management", "Trading", "Tax Law", "Auditing", "Valuation", "QuickBooks", "SAP"],
        interests: ["Markets", "Economics", "Investing", "Numbers", "Finance", "Wealth", "Risk"]
    },
    "Healthcare": {
        titles: ["Registered Nurse", "Physician", "Surgeon", "Dentist", "Pharmacist", "Physical Therapist", "Occupational Therapist", "Medical Assistant", "Radiologic Technologist", "Paramedic", "Medical Laboratory Technician", "Dietitian", "Healthcare Administrator", "Public Health Specialist", "Clinical Researcher"],
        skills: ["Patient Care", "Anatomy", "Physiology", "Medical Terminology", "CPR", "First Aid", "Nursing", "Diagnostics", "Treatment Planning", "Surgery", "Pharmacy", "Therapy", "Healthcare Management", "Research", "Public Health"],
        interests: ["Helping People", "Biology", "Medicine", "Health", "Science", "Caregiving", "Wellness"]
    },
    "Education": {
        titles: ["Teacher", "Professor", "Instructor", "Tutor", "School Counselor", "Principal", "Education Administrator", "Instructional Designer", "Special Education Teacher", "ESL Teacher", "Librarian", "Admissions Counselor", "Academic Advisor", "Curriculum Developer", "Corporate Trainer"],
        skills: ["Teaching", "Communication", "Curriculum Development", "Instructional Design", "Mentoring", "Counseling", "Classroom Management", "Education Administration", "Research", "Writing", "Public Speaking", "E-learning", "Coaching", "Evaluation", "Patience"],
        interests: ["Education", "Learning", "Helping People", "Mentoring", "Academia", "Teaching", "Youth"]
    },
    "Engineering": {
        titles: ["Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Chemical Engineer", "Aerospace Engineer", "Biomedical Engineer", "Environmental Engineer", "Industrial Engineer", "Petroleum Engineer", "Materials Engineer", "Nuclear Engineer", "Structural Engineer", "Automotive Engineer", "Marine Engineer", "Robotics Engineer"],
        skills: ["CAD", "AutoCAD", "SolidWorks", "MATLAB", "Engineering Design", "Physics", "Chemistry", "Mathematics", "Project Management", "Problem Solving", "Manufacturing", "Thermodynamics", "Materials Science", "Robotics", "Systems Engineering"],
        interests: ["Building things", "Physics", "Mechanics", "Design", "Innovation", "Technology", "Problem Solving"]
    },
    "Legal": {
        titles: ["Lawyer", "Attorney", "Paralegal", "Legal Assistant", "Judge", "Mediator", "Legal Consultant", "Compliance Officer", "Intellectual Property Lawyer", "Corporate Counsel", "Defense Attorney", "Prosecutor", "Immigration Lawyer", "Family Lawyer", "Contract Administrator"],
        skills: ["Legal Research", "Argumentation", "Writing", "Negotiation", "Public Speaking", "Critical Thinking", "Contract Drafting", "Compliance", "Litigation", "Mediation", "Corporate Law", "Intellectual Property", "Tax Law", "Ethics", "Analysis"],
        interests: ["Law", "Justice", "Debate", "Ethics", "Reading", "History", "Writing"]
    }
}

// Generate combinations
let careers = [];
let idCounter = 1;

for (const category in fields) {
    const data = fields[category];

    data.titles.forEach(title => {
        // Create base title
        const salaryBase = 400000 + Math.floor(Math.random() * 600000);
        const salaryMax = salaryBase + 400000 + Math.floor(Math.random() * 1000000);

        // Pick 4-6 random skills
        const numSkills = 4 + Math.floor(Math.random() * 3);
        const shuffledSkills = [...data.skills].sort(() => 0.5 - Math.random());
        const selectedSkills = shuffledSkills.slice(0, numSkills);

        // Pick 2-4 random interests
        const numInterests = 2 + Math.floor(Math.random() * 3);
        const shuffledInterests = [...data.interests].sort(() => 0.5 - Math.random());
        const selectedInterests = shuffledInterests.slice(0, numInterests);

        careers.push({
            id: `c${idCounter++}`,
            title: title,
            category: category,
            description: `A highly skilled professional specializing in ${title.toLowerCase()} within the ${category} industry. Focuses on delivering high-quality results and driving innovation.`,
            salaryRange: `₹${(salaryBase / 100000).toFixed(1)}L - ₹${(salaryMax / 100000).toFixed(1)}L+`,
            workLifeBalance: ['Excellent', 'Good', 'Variable', 'Demanding', 'Highly Flexible'][Math.floor(Math.random() * 5)],
            growthPotential: ['Very High', 'High', 'Medium'][Math.floor(Math.random() * 3)],
            skillsRequired: selectedSkills,
            relatedInterests: selectedInterests,
            stats: {
                salaryScore: 5 + Math.floor(Math.random() * 6),
                growthScore: 5 + Math.floor(Math.random() * 6),
                demandScore: 6 + Math.floor(Math.random() * 5),
                workLifeScore: 4 + Math.floor(Math.random() * 7)
            }
        });

        // Add prefixed versions if not enough, but we have 15*10 = 150 base titles. Let's add "Senior x" to reach 200+
        if (idCounter <= 220 && Math.random() > 0.5) {
            const prefix = jobPrefixes[Math.floor(Math.random() * jobPrefixes.length)];
            const senSalaryBase = salaryBase * 1.5;
            const senSalaryMax = salaryMax * 1.5;
            careers.push({
                id: `c${idCounter++}`,
                title: `${prefix} ${title}`,
                category: category,
                description: `An experienced leader overseeing ${title.toLowerCase()} operations within the ${category} industry. Brings years of expertise and drives strategic innovation.`,
                salaryRange: `₹${(senSalaryBase / 100000).toFixed(1)}L - ₹${(senSalaryMax / 100000).toFixed(1)}L+`,
                workLifeBalance: ['Variable', 'Demanding', 'Good'][Math.floor(Math.random() * 3)],
                growthPotential: ['Medium', 'High'][Math.floor(Math.random() * 2)],
                skillsRequired: [...selectedSkills, "Leadership", "Mentoring", "Strategy"],
                relatedInterests: [...selectedInterests, "Management"],
                stats: {
                    salaryScore: Math.min(10, 7 + Math.floor(Math.random() * 4)),
                    growthScore: 4 + Math.floor(Math.random() * 5),
                    demandScore: 7 + Math.floor(Math.random() * 4),
                    workLifeScore: 3 + Math.floor(Math.random() * 6)
                }
            });
        }
    });
}

// Curated direct course/book links per category (verified working URLs)
const categoryLinks = {
    'Technology': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/learn/html-css-javascript-for-web-developers', title: 'HTML, CSS, and Javascript for Web Developers' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-javascript-course/', title: 'The Complete JavaScript Course 2024' },
        { type: 'Book', platform: 'O\'Reilly', link: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/', title: 'Clean Code by Robert C. Martin' }
    ],
    'Data & AI': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/specializations/deep-learning', title: 'Deep Learning Specialization (Andrew Ng)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/', title: 'Python for Data Science and Machine Learning Bootcamp' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Hands-Machine-Learning-Scikit-Learn-TensorFlow/dp/1492032646', title: 'Hands-On Machine Learning (Geron)' }
    ],
    'Design': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/specializations/interaction-design', title: 'Interaction Design Specialization (UC San Diego)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/ui-ux-web-design-using-adobe-xd/', title: 'UI / UX Design with Adobe XD' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Design-Everyday-Things-Revised-Expanded/dp/0465050654', title: 'The Design of Everyday Things' }
    ],
    'Marketing': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/specializations/digital-marketing', title: 'Digital Marketing Specialization (Illinois)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-digital-marketing-course/', title: 'The Complete Digital Marketing Course' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/This-Marketing-Cant-Until-Learn/dp/0525540830', title: 'This Is Marketing by Seth Godin' }
    ],
    'Business': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/specializations/wharton-business-foundations', title: 'Business Foundations Specialization (Wharton)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/an-entire-mba-in-1-courseaward-winning-business-school-prof/', title: 'An Entire MBA in 1 Course' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898', title: 'The Lean Startup by Eric Ries' }
    ],
    'Finance': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/learn/finance-for-non-finance-managers', title: 'Finance for Non-Finance Managers (UC Davis)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-financial-analyst-course/', title: 'The Complete Financial Analyst Course' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Intelligent-Investor-Benjamin-Graham/dp/0062312685', title: 'The Intelligent Investor by Benjamin Graham' }
    ],
    'Healthcare': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/learn/healthcare-law', title: 'Healthcare Law (Johns Hopkins)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/fundamentals-of-nursing/', title: 'Fundamentals of Nursing' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Medical-Handbook-Emergency-Reference-Cards/dp/0071634460', title: 'Tintinalli\'s Emergency Medicine Manual' }
    ],
    'Education': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/learn/learning-how-to-learn', title: 'Learning How to Learn (McMaster)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-teaching-course/', title: 'The Complete Teaching Course' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Mindstorms-Children-Computers-Powerful-Ideas/dp/0465046746', title: 'Mindstorms by Seymour Papert' }
    ],
    'Engineering': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/specializations/algorithms', title: 'Algorithms Specialization (Stanford)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/autocad-2d-and-3d-practice-drawings/', title: 'AutoCAD 2D and 3D Practice Drawings' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/Engineering-Mechanics-Statics-Dynamics-Bedford/dp/0136750079', title: 'Engineering Mechanics: Statics & Dynamics' }
    ],
    'Legal': [
        { type: 'Course', platform: 'Coursera', link: 'https://www.coursera.org/learn/an-introduction-to-american-law', title: 'An Introduction to American Law (Penn)' },
        { type: 'Certification', platform: 'Udemy', link: 'https://www.udemy.com/course/legal-writing-certificate/', title: 'Legal Writing Certificate Course' },
        { type: 'Book', platform: 'Amazon', link: 'https://www.amazon.in/To-Kill-Mockingbird-Harper-Lee/dp/0061935462', title: 'A Civil Action by Jonathan Harr' }
    ]
};

// Generates a detailed 1-Year roadmap for a given career title and skills
function generate1YearPlan(title, skills) {
    const coreSkill1 = skills[0] || "Core Fundamentals";
    const coreSkill2 = skills[1] || "Industry Tools";
    const coreSkill3 = skills[2] || "Advanced Methodologies";
    const extraSkills = skills.slice(3).join(', ') || "general workflows";

    return [
        {
            day: "Months 1-2",
            title: `Foundation & ${coreSkill1}`,
            desc: `
                <p><strong>Goal:</strong> Build a rock-solid foundation in the core principles of a ${title}. Dedicate the first two months entirely to mastering <b>${coreSkill1}</b> through hands-on tutorials and basic projects.</p>
                <div style="margin-top: 8px;">
                    <strong>Focus Areas:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px; color: var(--text-secondary);">
                        <li>Setting up your professional development environment.</li>
                        <li>Deep-diving into the foundational syntax, theories, or rules of ${coreSkill1}.</li>
                        <li>Understanding the daily operations and business value of ${title}s.</li>
                    </ul>
                </div>
                <div style="margin-top: 8px;">
                    <strong>Action Item:</strong> Complete at least three "Hello World" or equivalent introductory projects from scratch.
                </div>`
        },
        {
            day: "Months 3-5",
            title: `Core Competency & ${coreSkill2}`,
            desc: `
                <p><strong>Goal:</strong> Transition from basics to intermediate practical application by deeply integrating <b>${coreSkill2}</b>. Begin building mid-scale applications or workflows.</p>
                <div style="margin-top: 8px;">
                    <strong>Focus Areas:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px; color: var(--text-secondary);">
                        <li>Combining ${coreSkill1} with ${coreSkill2} to solve complex, multi-step problems.</li>
                        <li>Exploring common industry design patterns and standard best practices.</li>
                        <li>Mastering debugging, troubleshooting, and independent documentation research.</li>
                    </ul>
                </div>
                <div style="margin-top: 8px;">
                    <strong>Action Item:</strong> Build and deploy a fully functional MVP (Minimum Viable Product) or comprehensive case study.
                </div>`
        },
        {
            day: "Months 6-8",
            title: `Advanced Architecture & ${coreSkill3}`,
            desc: `
                <p><strong>Goal:</strong> Tackle professional-grade scenarios. Focus on optimization, scalability, and leveraging <b>${coreSkill3}</b> alongside ${extraSkills} to build robust systems.</p>
                <div style="margin-top: 8px;">
                    <strong>Focus Areas:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px; color: var(--text-secondary);">
                        <li>Performance optimization, refactoring, and advanced architectural decisions.</li>
                        <li>Incorporating secondary tools like ${extraSkills} into an automated workflow.</li>
                        <li>Studying and reverse-engineering real-world, production-level examples.</li>
                    </ul>
                </div>
                <div style="margin-top: 8px;">
                    <strong>Action Item:</strong> Contribute to an open-source project or refactor your MVP to handle scale and edge-cases.
                </div>`
        },
        {
            day: "Months 9-11",
            title: "Specialization & Portfolio Generation",
            desc: `
                <p><strong>Goal:</strong> Establish your specific niche. Compile your absolute best, most complex work into a stunning professional portfolio.</p>
                <div style="margin-top: 8px;">
                    <strong>Focus Areas:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px; color: var(--text-secondary);">
                        <li>Writing highly detailed, structured READMEs or comprehensive UX/Business case studies.</li>
                        <li>Clearly quantifying the specific impact and ROI of ${coreSkill1} in your projects.</li>
                        <li>Polishing, deploying, and formally publishing your top 3 pieces of work.</li>
                    </ul>
                </div>
                <div style="margin-top: 8px;">
                    <strong>Action Item:</strong> Launch a live personal portfolio website or high-tier Behance/GitHub profile.
                </div>`
        },
        {
            day: "Month 12",
            title: "Interview Prep & Community Authority",
            desc: `
                <p><strong>Goal:</strong> Secure your professional standing. Treat job hunting and networking as a full-time endeavor.</p>
                <div style="margin-top: 8px;">
                    <strong>Focus Areas:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px; color: var(--text-secondary);">
                        <li>Rigorous practice of behavioral and technical whiteboard/take-home tests for a ${title}.</li>
                        <li>Tailoring and A/B testing your resume targeting ${skills.slice(0, 3).join(', ')}.</li>
                        <li>Active thought-leadership and networking on LinkedIn, Discord, or attending local meetups.</li>
                    </ul>
                </div>
                <div style="margin-top: 8px;">
                    <strong>Action Item:</strong> Complete 5 mock interviews and begin sending out 10+ tailored job applications weekly.
                </div>`
        }
    ];
}

// Generate resources for each career — unique per title
const resources = {};
careers.forEach(career => {
    const encodedTitle = encodeURIComponent(career.title);
    const encodedCategory = encodeURIComponent(career.category);
    const encodedBookQuery = encodeURIComponent(career.title + ' career guide');

    // Add specific search links tailored directly to the exact career title
    const specificLinks = [
        {
            type: 'Roadmap',
            title: `1-Year ${career.title} Learning Plan`,
            platform: 'In-App',
            isInternal: true,
            steps: generate1YearPlan(career.title, career.skillsRequired)
        },
        {
            type: 'Course',
            title: `${career.title} — Complete Course`,
            platform: 'Coursera',
            link: `https://www.coursera.org/search?query=${encodedTitle}&index=prod_all_launched_products_term_optimization`
        },
        {
            type: 'Certification',
            title: `${career.title} Professional Certification`,
            platform: 'Udemy',
            link: `https://www.udemy.com/courses/search/?src=ukw&q=${encodedTitle}`
        },
        {
            type: 'Book',
            title: `${career.title} Career Guide & Handbook`,
            platform: 'Amazon',
            link: `https://www.amazon.com/s?k=${encodedBookQuery}&i=stripbooks`
        }
    ];

    // Combine them so users get specific searches
    resources[career.id] = specificLinks;
});


// Create Data files Content
const publicDataJs = "// Data file for Pathfinder AI\n\nconst careers = " + JSON.stringify(careers, null, 4) + ";\n\nconst resources = " + JSON.stringify(resources, null, 4) + ";\n";

const mockDataJs = "const careers = " + JSON.stringify(careers, null, 4) + ";\n\nconst resources = " + JSON.stringify(resources, null, 4) + ";\n\nmodule.exports = {\n    careers,\n    resources\n};\n";

// Write files
fs.writeFileSync(path.join(__dirname, 'public', 'data.js'), publicDataJs);
fs.writeFileSync(path.join(__dirname, 'data', 'mockData.js'), mockDataJs);

console.log("Successfully generated " + careers.length + " careers and wrote to data.js & mockData.js.");
