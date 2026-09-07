# Final Year Project — Detailed Functional Requirements Document (FRD)

## Project Title

**CareerGraph — AI-Powered Personalized Education-to-Career Guidance and College Intelligence Platform**

### Proposed academic title

**An Explainable AI-Driven Personalized Education-to-Career Pathway and Learning Recommendation System**

---

# 1. Executive Summary

## 1.1 What is this project?

CareerGraph is a web platform designed to help students answer a very simple question:

> **“I know what I want to become. What should I do next?”**

A student may be in Class 10, Class 12, college, or near graduation. They may want to become a Software Engineer, Cybersecurity Analyst, Data Scientist, Civil Servant, CA, MBA graduate, or pursue another career.

The platform will understand:

- where the student is today,
- what the student already knows,
- what the student wants to achieve,
- what the target career requires,
- what skills are missing,
- what the student should learn next,
- whether the student is improving.

The first implementation will be **college-focused**. It will provide a common academic and career ecosystem for students, seniors, alumni, mentors and faculty.

The architecture will be designed so that the system can later expand beyond one college and support broader education-to-career pathways.

---

# 2. The Problem We Are Solving

## 2.1 Explain the problem like a simple story

Imagine a Class 10 student.

The student says:

> “I want to become a Software Engineer at a good technology company.”

The student immediately has many questions:

- What should I study after Class 10?
- Which subjects should I choose?
- Should I prepare for an entrance examination?
- Which type of college should I target?
- What degree should I pursue?
- When should I start programming?
- Which programming language should I learn?
- When should I start DSA?
- What projects should I build?
- When should I search for internships?
- What do software companies ask in interviews?
- What skills do I currently lack?

Information about all these things exists, but it is spread across many places.

The student may have to use:

- YouTube
- search engines
- educational websites
- coding platforms
- job portals
- social communities
- seniors
- teachers
- career counsellors
- AI chatbots

The problem is therefore **not simply a lack of information**.

The problem is:

> **Students have a lot of information, but they do not have one personalized, trustworthy and continuously updated system that connects their current situation to their future educational and career goals.**

---

# 3. College-Specific Problem

For the first version, we will solve the problem inside our college.

A student in our college may ask:

> “How did seniors from our college prepare for Company X?”

or:

> “What resources should I use for DBMS?”

or:

> “Which skills are commonly required for software placements?”

or:

> “What did students from previous batches do to get internships?”

This information may already exist inside:

- senior experiences,
- placement records,
- faculty resources,
- student notes,
- interview experiences,
- community discussions,
- college announcements.

However, it is usually scattered.

CareerGraph will bring this information together.

---

# 4. Proposed Solution

CareerGraph will create a **personalized student intelligence layer**.

The core idea is:

```text
Student's Current State
        ↓
Student Knowledge / Skill Profile
        ↓
Target Career
        ↓
Target Career Skill Requirements
        ↓
Skill Gap Analysis
        ↓
Personalized Learning Path
        ↓
Learning + Practice
        ↓
Assessment
        ↓
Update Student Knowledge
        ↓
Improve Recommendation
        ↺
```

The system will also connect the student to:

- college resources,
- RAG-based academic assistance,
- seniors and alumni,
- communities,
- internships and jobs,
- interview preparation,
- security/trust information.

---

# 5. Project Vision

The long-term vision is:

> **To create a student's intelligent education-to-career workspace where learning, assessment, career planning, peer knowledge and opportunities are connected in one system.**

The first release will focus on the college ecosystem.

The future system can support a broader journey:

```text
Class 10
   ↓
Class 12
   ↓
Higher Education
   ↓
Skills
   ↓
Projects
   ↓
Internships
   ↓
Job Preparation
   ↓
Career
```

---

# 6. Important Clarification

CareerGraph is **not** intended to tell a student:

> “You must become a Software Engineer.”

It will not claim to predict a student's future with certainty.

Instead, it will say:

> “Based on the information currently available about your interests, education, skills and goals, these pathways appear relevant. Here are the requirements, gaps, options and next steps.”

The student remains responsible for the final career decision.

---

# 7. Project Objectives

## Primary Objectives

1. Build a college-focused education and career platform.
2. Create a structured digital student profile.
3. Represent student skills and career requirements in a structured form.
4. Identify gaps between current skills and target career requirements.
5. Generate personalized and explainable learning pathways.
6. Provide academic assistance using trusted college resources through RAG.
7. Connect students with senior/alumni knowledge.
8. Provide an intelligent student community.
9. Provide AI-assisted interview preparation.
10. Analyze job descriptions and compare them with student skills.
11. Add meaningful cybersecurity controls.
12. Provide tamper-evident credential verification using blockchain.
13. Evaluate AI/ML components using measurable metrics.

---

# 8. Target Users

## 8.1 Students

The primary users.

Examples:

- First-year students
- Engineering students
- Final-year students
- Students preparing for placements
- Students exploring careers
- Students preparing for competitive examinations

## 8.2 Seniors and Alumni

They can contribute:

- placement journeys,
- interview experiences,
- preparation strategies,
- resources,
- projects,
- career advice,
- mistakes and lessons.

## 8.3 Mentors

Verified mentors can:

- guide students,
- participate in discussions,
- provide career advice,
- share resources.

## 8.4 Faculty

Faculty can:

- upload academic resources,
- publish announcements,
- moderate content,
- verify selected information,
- monitor learning analytics where permitted.

## 8.5 Administrators

Administrators manage:

- users,
- roles,
- communities,
- resources,
- reports,
- opportunities,
- moderation,
- security events,
- platform analytics.

---

# 9. Core User Journey

A typical student journey will look like this:

```text
Create Account
      ↓
Create Student Profile
      ↓
Select / Explore Career
      ↓
Take Skill Assessment
      ↓
Build Current Skill Profile
      ↓
Compare with Career Requirements
      ↓
Identify Skill Gaps
      ↓
Receive Personalized Roadmap
      ↓
Study Recommended Resources
      ↓
Practice / Take Assessments
      ↓
Update Skill Knowledge
      ↓
Practice Interview
      ↓
Review Weak Areas
      ↓
Improve Skills
      ↓
Apply for Opportunities
      ↓
Update Career Profile
```

---

# 10. Module 1 — Student Profile

## Purpose

Create a structured representation of the student.

## Data

The profile can contain:

- name,
- college,
- department,
- year/semester,
- academic performance,
- technical skills,
- soft skills,
- interests,
- career goals,
- projects,
- certifications,
- assessments,
- learning progress,
- interview performance,
- community participation.

## Example

```text
Student: Example Student
Branch: CSE
Year: 3

Career Goal:
Backend Software Engineer

Skills:
Java       → Intermediate
SQL        → Intermediate
DSA        → Beginner
Spring     → Beginner
Docker     → Beginner
AWS        → Beginner
```

The profile should change as the student learns.

---

# 11. Module 2 — Student Knowledge / Skill Graph

## Purpose

Represent relationships between skills instead of treating every skill as an isolated number.

Example:

```text
Backend Developer
       |
       ├── Programming
       |      └── Java
       |
       ├── Web Backend
       |      ├── HTTP
       |      ├── REST
       |      └── Spring Boot
       |
       ├── Database
       |      └── SQL
       |
       ├── DevOps
       |      ├── Linux
       |      ├── Docker
       |      └── Cloud
       |
       └── Interview
              ├── DSA
              ├── OS
              ├── DBMS
              └── System Design
```

The student's current knowledge can be represented against this structure.

This makes it possible to identify:

- missing skills,
- weak skills,
- prerequisite skills,
- high-priority skills.

---

# 12. Module 3 — Career Knowledge Graph

Each supported career will have a structured definition.

Example:

```text
Career:
Backend Software Engineer

Required Skills:
- Programming
- DSA
- OOP
- SQL
- REST APIs
- Backend Framework
- Git

Advanced / Preferred:
- Docker
- Cloud
- System Design
- CI/CD
```

The system will also represent prerequisite relationships.

Example:

```text
Programming
     ↓
OOP
     ↓
Backend Framework
     ↓
REST APIs
     ↓
Docker
     ↓
Cloud
```

This graph can be extended for other career pathways.

---

# 13. Module 4 — Career Exploration

Students can select or explore careers.

Initial demonstration careers may include:

- Software Engineer
- Backend Developer
- Data Analyst
- Data/ML Engineer
- Cybersecurity Analyst
- Product/Management pathway
- Competitive examination pathway

The architecture should allow more careers to be added later.

The system will not claim that one career is universally best.

---

# 14. Module 5 — Skill Assessment

## Purpose

Measure what the student actually knows.

Assessments may include:

- programming,
- DSA,
- DBMS,
- OS,
- Computer Networks,
- aptitude,
- role-specific knowledge.

Each question can contain:

```text
Question
Topic
Subtopic
Difficulty
Expected Skill
Correct Answer
```

Student interactions can record:

```text
Correct / Incorrect
Time Taken
Attempts
Topic
Difficulty
```

This data becomes useful for student modeling.

---

# 15. Module 6 — Student Knowledge Estimation

After assessments, the system estimates the student's current mastery.

Example:

```text
DSA
Arrays       → Strong
Trees        → Weak
Graphs       → Beginner
Dynamic Prog → Beginner
```

Instead of permanently assigning:

```text
DSA = 5/10
```

the system can maintain a changing estimate.

As the student answers more questions:

```text
Assessment
    ↓
Performance
    ↓
Knowledge estimate
    ↓
Update profile
```

This is an area related to **Knowledge Tracing**, a major research direction in educational technology.

---

# 16. Module 7 — Skill Gap Engine

## Purpose

Compare:

```text
What the student knows
        VS
What the target career requires
```

Example:

```text
Target: Backend Software Engineer

Java          ✓ Strong
SQL           ✓ Strong
DSA           ⚠ Weak
Spring Boot   ⚠ Beginner
REST          ⚠ Beginner
Docker        ❌ Missing
AWS           ❌ Missing
```

The system should rank the gaps.

Example:

```text
HIGH PRIORITY:
Spring Boot

MEDIUM:
Docker

LOWER PRIORITY:
AWS
```

Priority can consider:

- importance to target career,
- prerequisites,
- current proficiency,
- job requirements,
- learning history.

---

# 17. Module 8 — Job Description Analyzer

A student can upload or paste a job description.

Example:

```text
Software Engineer

Required:
Java
DSA
SQL
Spring Boot

Preferred:
Docker
AWS
Kubernetes
```

The system extracts requirements using NLP/semantic techniques.

It then compares them with the student's profile.

Output:

```text
Match: 72%

Strong:
Java
SQL

Needs Improvement:
DSA
Spring Boot

Missing:
Docker
AWS
```

The system should explain the score instead of producing an unexplained percentage.

---

# 18. Module 9 — Personalized Career Roadmap

The roadmap is generated from:

```text
Student Profile
+
Student Knowledge State
+
Target Career
+
Career Skill Graph
+
Skill Gaps
+
Prerequisites
+
Relevant Job Requirements
```

Example:

```text
Current State
     ↓
REST Fundamentals
     ↓
Spring Boot
     ↓
Build REST API
     ↓
Authentication
     ↓
Database Integration
     ↓
Docker
     ↓
Cloud
     ↓
System Design
     ↓
Interview Preparation
```

The roadmap should be explainable.

Example:

> “Spring Boot is recommended before Docker because your selected target role requires backend development and your current profile indicates a gap in backend framework knowledge.”

---

# 19. Module 10 — Personalized Learning Recommendation

For every student, the system can recommend:

- college notes,
- external learning resources,
- practice questions,
- projects,
- interview topics,
- communities,
- senior experiences.

Recommendations may consider:

- current skill level,
- target role,
- weak areas,
- assessment performance,
- learning history,
- academic subjects,
- resource quality.

The system should not recommend everything.

It should prioritize the most useful next action.

---

# 20. Module 11 — RAG Academic Assistant

## Purpose

Allow students to ask questions about trusted academic material.

Input:

- college notes,
- approved PDFs,
- syllabus,
- lab manuals,
- previous-year papers,
- faculty-provided material.

Pipeline:

```text
Document
   ↓
Text Extraction
   ↓
Chunking
   ↓
Embeddings
   ↓
Vector Database
   ↓
Similarity Search
   ↓
Relevant Content
   ↓
LLM
   ↓
Answer + Source
```

Example:

Student:

> “Explain normalization from my DBMS notes.”

System:

> Explanation...

Source:

> DBMS Unit 3, Page 14

The system should distinguish between:

- information found in the college knowledge base,
- general AI-generated information.

This helps reduce unsupported answers.

---

# 21. Module 12 — Senior / Alumni Knowledge Network

Seniors and alumni can share:

- placement journeys,
- interview rounds,
- preparation roadmaps,
- resources,
- projects,
- mistakes,
- career advice.

Example:

```text
Company: Example Company
Role: SDE
Batch: 2025

Selection Process:
1. Online Assessment
2. Technical Interview
3. Technical + HR
```

Students can search:

> “How did seniors from our college prepare for Company X?”

The system retrieves relevant experiences.

---

# 22. Module 13 — College Community

Communities can include:

- CSE
- ECE
- Mechanical
- Placements
- DSA
- AI/ML
- Cybersecurity
- Projects
- Internships
- Company preparation
- Competitive examinations.

Post types:

- Questions
- Experiences
- Resources
- Interview Experiences
- Opportunities
- Warnings
- Discussions

---

# 23. Module 14 — AI Community Intelligence

The system can use NLP to organize community information.

## Automatic Post Classification

Classify posts into:

- Question
- Experience
- Resource
- Opportunity
- Warning
- Interview Experience
- Discussion

## Similar Discussion Detection

Example:

Student asks:

> “How should I start DSA?”

System:

> “We found similar discussions.”

This can be implemented using embeddings and vector similarity.

## Community Summaries

Long discussions can be summarized.

## Topic / Trend Detection

The system can detect topics that are becoming more discussed.

Example:

> “DBMS interview discussions have increased recently.”

---

# 24. Module 15 — Community Sentiment / Opinion Signals

The platform can analyze discussion sentiment around:

- courses,
- internships,
- companies,
- exams,
- resources.

Example:

```text
Community opinion signal:
Positive: 72%
Negative: 18%
Neutral: 10%
```

This must be presented as a community signal, not an absolute truth.

The system should allow users to inspect the underlying discussions.

---

# 25. Module 16 — Internship and Opportunity Hub

Students can discover:

- internships,
- jobs,
- scholarships,
- hackathons,
- competitions,
- campus opportunities.

Each opportunity may contain:

```text
Organization
Role
Eligibility
Location
Stipend / Salary
Deadline
Source
Required Skills
Verification Status
```

Official or trusted sources should be preferred.

---

# 26. Module 17 — Opportunity Trust / Risk Detection

This is an important cybersecurity + AI component.

Suppose an opportunity says:

> “Pay ₹999 to register for guaranteed internship.”

The system can identify risk signals.

Possible signals:

- payment request,
- suspicious URL,
- unverified source,
- community reports,
- repeated complaints,
- suspicious wording,
- source mismatch.

Output:

```text
Opportunity Risk: HIGH

Reasons:
• Payment request detected
• Source not verified
• Multiple reports
```

The system must not automatically declare an opportunity fraudulent solely because of an AI prediction.

The output is:

> **“Risk indicators detected. Verify before proceeding.”**

---

# 27. Module 18 — AI Interview Simulator

Students choose a role.

Example:

```text
Backend SDE
```

Interview:

```text
Question
   ↓
Student Answer
   ↓
AI Evaluation
   ↓
Follow-up Question
   ↓
Difficulty Adjustment
```

The final report can contain:

- technical knowledge,
- problem solving,
- communication,
- CS fundamentals,
- answer quality,
- overall preparation indicator.

The interview result can update the student's profile.

Example:

```text
DBMS weakness detected
        ↓
Skill profile updated
        ↓
DBMS resources recommended
```

---

# 28. Module 19 — What-If Career Simulator

Students can compare career options.

Example:

```text
Current Student Profile

        ↓

Software Engineering
Current Match: 68%
Main gaps: DSA, Backend

Cybersecurity
Current Match: 54%
Main gaps: Networking, Linux

Data/ML
Current Match: 41%
Main gaps: Python, Mathematics, ML
```

The system explains the differences.

It does not decide the student's career.

---

# 29. Module 20 — Career Path Evidence

The college-specific system can use verified senior/alumni experiences.

Example:

```text
Students from this college
who entered software roles
        ↓
Common skills
        ↓
Common preparation
        ↓
Common interview topics
        ↓
Useful resources
```

This creates institution-specific knowledge that a generic AI system may not have.

---

# 30. Module 21 — Security Architecture

Cybersecurity is part of the system design, not an afterthought.

## Authentication

- secure password hashing,
- email verification,
- secure session/JWT handling,
- refresh token protection.

## Authorization

Role-Based Access Control:

```text
Student
Senior
Mentor
Faculty
Moderator
Admin
```

## Protection

- input validation,
- rate limiting,
- secure file uploads,
- XSS protection,
- malicious link detection,
- spam prevention,
- bot-abuse prevention.

## Audit Logs

Record important security/admin events:

```text
User
Action
Timestamp
Resource
Result
```

---

# 31. Module 22 — Blockchain Credential Verification

Blockchain will be used only where immutability is useful.

Example:

College issues an achievement certificate.

```text
Certificate Metadata
       ↓
SHA-256 Hash
       ↓
Blockchain Ledger
```

Verification:

```text
Submitted Credential
       ↓
Generate Hash
       ↓
Compare with Blockchain
       ↓
Match → Verified
No Match → Not Verified
```

Private documents and sensitive student data will not be stored directly on-chain.

---

# 32. AI Architecture

The project will NOT train a large language model from scratch.

Instead, it will use a combination of:

### Existing foundation models

For:

- explanation,
- summarization,
- conversational guidance,
- interview interaction.

### Our ML models

For selected tasks such as:

- student skill estimation,
- community classification,
- opportunity-risk classification,
- recommendation/ranking.

### Embedding models

For:

- job ↔ student semantic matching,
- question ↔ similar question,
- student ↔ resource,
- community search.

### Structured knowledge

For:

- career requirements,
- skills,
- prerequisites,
- pathways.

---

# 33. Model Training Strategy

## Stage 1 — Baseline

Start with simple, explainable methods.

Examples:

- rule-based skill gap,
- cosine similarity,
- logistic regression,
- random forest,
- TF-IDF + classifier.

## Stage 2 — Improve

Use:

- sentence embeddings,
- semantic similarity,
- better ranking,
- knowledge tracing.

## Stage 3 — Research Experiment

Compare the baseline with an advanced approach where data is sufficient.

The project should prefer a small, well-evaluated model over an unnecessarily complicated model.

---

# 34. Data Strategy

We will not assume that millions of student records are available.

The initial datasets can be built from:

## Career Dataset

Curated career-skill relationships and public job descriptions.

## Assessment Dataset

Our own question bank.

Each question is tagged with:

- topic,
- skill,
- difficulty.

## Community Dataset

Initially label a sample of college/community posts.

## RAG Dataset

College-approved:

- notes,
- syllabus,
- PDFs,
- lab material,
- academic documents.

## Senior Knowledge Dataset

Verified senior/alumni contributions.

---

# 35. Continuous Learning Loop

The platform should record useful learning interactions.

Example:

```text
Student
 ↓
Assessment
 ↓
Answer
 ↓
Topic
 ↓
Knowledge Estimate
 ↓
Recommendation
 ↓
Resource Used
 ↓
Practice
 ↓
New Assessment
 ↓
Updated Knowledge
```

This allows future personalization.

---

# 36. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Main Backend

- Node.js
- Express or NestJS
- REST APIs

## AI/ML Backend

- Python
- FastAPI

## ML

- Python
- NumPy
- Pandas
- scikit-learn
- PyTorch when justified

## Database

- PostgreSQL

## Vector Search

- pgvector

## Cache

- Redis

## Storage

- S3-compatible object storage

## AI

- Embedding models
- LLM APIs or suitable open-source models

## Deployment

- Docker
- Cloud deployment

## Blockchain

- EVM-compatible test network or local/private blockchain for prototype

---

# 37. High-Level Architecture

```text
                         USER
                           |
                           ↓
                  NEXT.JS FRONTEND
                           |
                           ↓
                   NODE / EXPRESS
                           |
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     PostgreSQL          Redis          File Storage
          |
          ↓
 Student / Career
 Knowledge Model
          |
          ↓
                 PYTHON FASTAPI
                    AI SERVICE
          |
    ┌─────┼──────┬───────┬─────────┐
    ↓     ↓      ↓       ↓         ↓
   ML    NLP    RAG   Recommend  Interview
    |     |      |       |         |
    └─────┴──────┴───────┴─────────┘
                    |
                    ↓
                 pgvector
                    |
                    ↓
                   LLM
```

Security surrounds the platform:

```text
Authentication
Authorization
RBAC
Rate Limiting
Input Validation
Secure Uploads
Audit Logs
Content Security
```

Blockchain is a separate credential-verification component.

---

# 38. Functional Requirements

## FR-01 — Authentication

The system shall allow users to register and log in securely.

## FR-02 — Role Management

The system shall support role-based permissions.

## FR-03 — Student Profile

The system shall allow students to maintain academic, skill and career information.

## FR-04 — Career Exploration

The system shall allow students to explore supported career pathways.

## FR-05 — Assessment

The system shall provide skill assessments.

## FR-06 — Skill Profile

The system shall maintain an evolving representation of student skills.

## FR-07 — Skill Gap

The system shall compare student capabilities against career requirements.

## FR-08 — Job Analysis

The system shall analyze uploaded/pasted job descriptions.

## FR-09 — Roadmap

The system shall recommend a personalized sequence of learning activities.

## FR-10 — Learning Recommendations

The system shall recommend relevant resources based on student state.

## FR-11 — RAG Assistant

The system shall answer questions using approved knowledge sources and provide source references where available.

## FR-12 — Community

The system shall support college/community discussions.

## FR-13 — Senior Knowledge

The system shall allow verified seniors/alumni to contribute experiences.

## FR-14 — Community Intelligence

The system shall classify and retrieve relevant discussions.

## FR-15 — Opportunity Hub

The system shall display structured opportunities.

## FR-16 — Risk Signals

The system shall identify potential opportunity-risk indicators.

## FR-17 — Interview

The system shall provide AI-assisted interview practice.

## FR-18 — Security

The system shall enforce authentication, authorization, rate limiting and secure content handling.

## FR-19 — Credential Verification

The system shall support hash-based credential verification using blockchain.

## FR-20 — Analytics

The system shall provide appropriate student/admin analytics.

---

# 39. Non-Functional Requirements

## Performance

- Normal application requests should be responsive.
- Heavy AI tasks should be processed asynchronously when required.
- Frequently accessed information may be cached.

## Scalability

Frontend, backend, AI services and workers should be independently scalable.

## Security

- secure authentication,
- authorization,
- validation,
- rate limiting,
- secure uploads,
- audit logging.

## Reliability

- error handling,
- retry mechanisms,
- logging,
- database backup strategy.

## Privacy

- minimize personal data,
- protect uploaded documents,
- do not store sensitive data on blockchain.

## Explainability

Important recommendations should provide understandable reasons.

---

# 40. AI/ML Components and Evaluation

The project will not claim that AI is accurate simply because it produces an answer.

Each important component should be evaluated.

## Skill Model

Possible metrics:

- Accuracy
- Precision
- Recall
- F1
- ROC-AUC where appropriate

## Semantic Job Matching

Possible metrics:

- Precision@K
- Recall@K
- ranking quality
- human relevance evaluation

## RAG

Evaluate:

- retrieval relevance,
- answer groundedness,
- citation correctness,
- hallucination rate.

## Community Classification

Evaluate:

- Precision,
- Recall,
- F1.

## Similar Discussion Search

Evaluate:

- Recall@K,
- Precision@K,
- human relevance.

## Recommendations

Evaluate:

- relevance,
- acceptance,
- completion,
- pre/post assessment improvement.

## Interview

Compare AI evaluation against human/faculty evaluation on a controlled test set.

---

# 41. Research Foundation

This project is based on multiple existing research areas.

We are NOT claiming that career recommendation, RAG, knowledge tracing or personalized learning were invented by this project.

The research contribution is the **integration, implementation and evaluation of selected techniques in a college-grounded education-to-career system.**

Relevant research areas include:

- Personalized Learning
- Knowledge Tracing
- Learning Path Recommendation
- Educational Recommender Systems
- Career Recommendation
- Knowledge Graphs
- Retrieval-Augmented Generation
- Explainable AI
- Natural Language Processing

---

# 42. Selected Research References

## 42.1 Learning Path Personalization

Learning path personalization and recommendation is an established research area involving learner goals, learner characteristics and learning resources.

Reference:

https://www.sciencedirect.com/science/article/pii/S0957417420304206

## 42.2 Knowledge Tracing

Knowledge tracing models a learner's changing knowledge state over time.

Reference:

https://arxiv.org/abs/2201.06953

## 42.3 Knowledge Graph + Personalized Learning

Recent research explores knowledge graphs for personalized learning path recommendation.

Reference:

https://www.mdpi.com/2079-9292/15/1/238

## 42.4 Knowledge Tracing + Learning Path Recommendation

Research has explored dynamically recommending learning paths based on learner knowledge state.

Reference:

https://www.sciencedirect.com/science/article/pii/S0950705124010657

## 42.5 Career Recommendation

Career recommendation for engineering students is an established machine-learning research problem.

Reference:

https://ieeexplore.ieee.org/document/9715788

## 42.6 Career Recommendation Using Content-Based Filtering

Reference:

https://ieeexplore.ieee.org/document/9918766

## 42.7 RAG in Education

A 2025 systematic survey examined RAG applications in education and discussed retrieval quality, hallucination and knowledge freshness.

Reference:

https://doi.org/10.1016/J.CAEAI.2025.100417

## 42.8 LLMs + Knowledge Graphs in Education

Research has explored integrating knowledge graphs and LLMs for educational applications.

Reference:

https://www.sciencedirect.com/science/article/abs/pii/S0925231225019022

---

# 43. Proposed Research Gap

The individual technologies already exist.

For example:

```text
Career Recommendation
        ↓
Research exists

Knowledge Tracing
        ↓
Research exists

RAG in Education
        ↓
Research exists

Learning Path Recommendation
        ↓
Research exists

Knowledge Graphs
        ↓
Research exists
```

Our project focuses on integrating these ideas into:

```text
College Context
      +
Student Knowledge State
      +
Career Knowledge
      +
Skill Gap
      +
Personalized Path
      +
College RAG
      +
Senior Knowledge
      +
Community Intelligence
      +
Interview Feedback
      +
Security / Trust
```

The research question becomes:

> **Can a student-centered system combining dynamic learner modeling, structured career knowledge, semantic matching, grounded educational assistance and institutional peer knowledge provide more relevant and explainable education-to-career guidance than generic/static guidance?**

This is the central research direction.

---

# 44. Proposed Experiments

## Experiment 1 — Generic vs Personalized Recommendation

Compare:

```text
Generic resources
        VS
Our personalized recommendation
```

Measure:

- relevance,
- completion,
- assessment improvement.

## Experiment 2 — Keyword vs Semantic Job Matching

Compare:

```text
Keyword matching
        VS
Embedding-based matching
```

Measure ranking/relevance.

## Experiment 3 — RAG vs General LLM

Compare:

```text
General LLM answer
        VS
College RAG answer
```

Measure:

- factual grounding,
- source correctness,
- hallucination.

## Experiment 4 — Rule-Based vs ML Skill Estimation

Compare a simple rule-based baseline with an ML-based model.

## Experiment 5 — Human vs AI Interview Evaluation

Compare AI evaluation with faculty/human evaluation on a controlled dataset.

---

# 45. MVP Scope

The project must avoid becoming too large.

## Phase 1 — Must Build

1. Authentication
2. Student profile
3. College learning hub
4. Community
5. Resource sharing
6. Assessments
7. Skill profile
8. Career knowledge model
9. Skill gap analysis
10. Job description semantic matching
11. Personalized roadmap
12. RAG assistant
13. AI interview
14. RBAC/security

## Phase 2 — Major Differentiators

1. Knowledge tracing
2. Personalized ranking
3. Similar-post detection
4. Community classification
5. Senior verification
6. Community trend analysis
7. Opportunity risk signals
8. Academic weakness detection
9. What-if career comparison

## Phase 3 — Advanced

1. Advanced recommendation model
2. Advanced graph reasoning
3. Blockchain credential verification
4. Advanced analytics
5. Multi-college expansion

---

# 46. What We Will NOT Build

To keep the project realistic:

- We will not train a foundation LLM from scratch.
- We will not build a complete university ERP.
- We will not attempt to support every career initially.
- We will not claim to predict a student's future.
- We will not automatically declare opportunities fraudulent solely using AI.
- We will not store sensitive student documents directly on blockchain.
- We will not build a full social-media platform.
- We will not build mobile and web simultaneously in the initial version.

---

# 47. Initial Career Scope

For a realistic prototype, the system can deeply model a small number of pathways.

Recommended initial pathways:

1. Software Engineering
2. Cybersecurity
3. Data/AI
4. Management/MBA
5. Competitive examination pathway

The underlying framework will allow additional careers later.

---

# 48. Suggested Team Responsibilities

## Member 1 — Frontend / Product

- Next.js
- UI/UX
- student dashboard
- career pages
- community
- learning hub.

## Member 2 — Backend

- Node.js
- REST APIs
- PostgreSQL
- authentication
- RBAC
- opportunities
- notifications
- admin.

## Member 3 — AI/ML

- skill estimation
- semantic matching
- recommendation
- NLP
- community intelligence
- evaluation.

## Member 4 — AI Infrastructure / Security

- Python/FastAPI
- RAG
- embeddings
- vector search
- interview AI
- cybersecurity
- blockchain prototype.

Team responsibilities can overlap.

---

# 49. Development Roadmap

## Phase 0 — Approval and Research

- Finalize PS
- Review literature
- Finalize research questions
- Define initial career pathways
- Define dataset strategy

## Phase 1 — Platform Foundation

- Next.js
- Node backend
- PostgreSQL
- authentication
- RBAC
- Docker
- base deployment

## Phase 2 — College Ecosystem

- profiles
- resources
- subjects
- communities
- senior experiences
- admin moderation.

## Phase 3 — Skill System

- assessment engine
- question bank
- skill taxonomy
- career skill graph
- student skill profile
- skill-gap engine.

## Phase 4 — AI

- embeddings
- semantic JD matching
- RAG
- recommendation engine
- knowledge estimation.

## Phase 5 — Interview / Community Intelligence

- interview simulator
- post classification
- similar discussion search
- trend analysis.

## Phase 6 — Security / Blockchain

- advanced security controls
- opportunity-risk signals
- credential verification prototype.

## Phase 7 — Evaluation

- collect test data
- run experiments
- compare baselines
- calculate metrics
- document limitations.

## Phase 8 — Final Deployment

- Docker
- production deployment
- monitoring
- documentation
- demonstration.

---

# 50. Example End-to-End Scenario

## Student

A third-year CSE student wants to become a Backend Software Engineer.

### Step 1

Student creates profile.

### Step 2

Student takes assessments.

Result:

```text
Java       80%
SQL        75%
DSA        42%
DBMS       70%
OS         55%
Spring     20%
Docker     10%
```

### Step 3

Student selects:

> Backend Software Engineer

### Step 4

System compares current skills with the career graph.

### Step 5

System identifies:

```text
High:
DSA
Spring Boot

Medium:
Docker

Later:
Cloud
System Design
```

### Step 6

Student uploads a real job description.

The system identifies additional requirements.

### Step 7

The roadmap changes.

### Step 8

Student learns using:

- college material,
- recommended resources,
- practice questions,
- projects.

### Step 9

Student asks the RAG assistant:

> “Explain transactions using our DBMS notes.”

The system answers with relevant source references.

### Step 10

Student searches:

> “How did seniors prepare for Company X?”

The platform retrieves verified senior experiences.

### Step 11

Student takes an AI interview.

The system detects weak DBMS answers.

### Step 12

Student profile updates.

### Step 13

The recommendation engine recommends additional DBMS practice.

### Step 14

After another assessment, the system detects improvement.

### Step 15

The roadmap changes again.

This demonstrates the central concept:

> **The platform is not just giving a roadmap once. It continuously adapts to the student's progress.**

---

# 51. Why This Is an Engineering Final-Year Project

The project contains multiple engineering layers:

```text
Web Engineering
+
Backend Engineering
+
Database Engineering
+
Distributed Service Architecture
+
AI/ML
+
NLP
+
RAG
+
Recommendation Systems
+
Knowledge Representation
+
Cybersecurity
+
Blockchain
+
Cloud Deployment
+
Experimental Evaluation
```

The project is therefore more than a CRUD application.

The key academic value comes from:

1. modeling the student,
2. modeling the career,
3. calculating the gap,
4. recommending a pathway,
5. updating the student model,
6. evaluating whether the recommendations work.

---

# 52. Final Problem Statement

> **Students often face fragmented educational resources and generic career guidance, making it difficult to understand which educational decisions, skills, learning activities and practical experiences are required to achieve their desired career goals. Existing platforms generally focus on isolated activities such as learning content, job discovery, interview preparation or social discussion rather than continuously connecting a student's current knowledge and progress with their target career pathway.**
>
> **This project proposes an AI-driven education-to-career platform that models a student's academic background, skills, interests, assessments and learning progress; represents career requirements and skill dependencies; identifies personalized skill gaps; recommends an explainable learning pathway; provides grounded academic assistance through Retrieval-Augmented Generation; incorporates verified senior/alumni knowledge and community intelligence; and uses interview and assessment outcomes to continuously update the student's learning recommendations.**
>
> **The initial implementation will be college-centric, allowing the platform to use institution-specific academic resources, senior experiences, communities and placement knowledge. The architecture will be designed to support future expansion to multiple colleges and broader education-to-career pathways.**

---

# 53. Final One-Line Definition

If someone asks:

> **“What is your project?”**

Answer:

> **“CareerGraph is an AI-powered system that understands where a student is today, understands where the student wants to go, identifies the gap between them, and continuously guides the student toward that goal using personalized learning, trusted educational resources, assessments, career intelligence and real experiences from the college community.”**

---

# 54. Final Project Vision

```text
                    STUDENT
                       ↓
                CURRENT STATE
                       ↓
              KNOWLEDGE PROFILE
                       ↓
                 CAREER GOAL
                       ↓
              CAREER KNOWLEDGE
                    GRAPH
                       ↓
                  SKILL GAP
                       ↓
             PERSONALIZED PATH
                       ↓
            LEARN + PRACTICE
                       ↓
                ASSESSMENT
                       ↓
               AI INTERVIEW
                       ↓
             PROFILE UPDATE
                       ↓
          NEW RECOMMENDATION
                       ↺

       + COLLEGE KNOWLEDGE
       + SENIOR EXPERIENCES
       + COMMUNITY
       + RAG
       + OPPORTUNITY TRUST
       + SECURITY
       + CREDENTIAL VERIFICATION
```

---

# 55. Approval Request

The team proposes to begin implementation only after faculty approval of:

1. The problem statement.
2. College-first scope.
3. Core feature set.
4. AI/ML research direction.
5. Dataset and evaluation methodology.
6. Technology architecture.

After approval, the next technical deliverables will be:

- Software Requirement Specification,
- System Architecture,
- Database ER Diagram,
- API specification,
- AI/ML architecture,
- Data schema,
- research methodology,
- implementation timeline,
- testing strategy.
