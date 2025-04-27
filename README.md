[Video Demo](https://www.loom.com/share/910c43ab4b73458093ce54223d699405?sid=ae8dc313-47ea-4c7f-8204-a01266f80943)

# NoteLab - Your Personal Learning Assistant

<p align="center">
  <img width="533" alt="NoteLab Logo" src="https://github.com/user-attachments/assets/401a4e93-3f48-4552-a8b6-f9138616930c" />
</p>

NoteLab is a smart note-taking platform that helps students stay present during lectures by handling audio transcription in real-time while enhancing personal notes with AI-powered enrichments.

## Table of Contents
- [Inspiration](#inspiration)
- [What NoteLab Does](#what-notelab-does)
- [Features](#features)
- [How We Built It](#how-we-built-it)
  - [Frontend Development](#frontend-development)
  - [Backend Development](#backend-development)
  - [AI/ML Integration](#aiml-integration)
- [Tech Stack](#tech-stack)
- [Setup and Installation](#setup-and-installation)
- [Challenges We Faced](#challenges-we-faced)
- [Accomplishments](#accomplishments)
- [What We Learned](#what-we-learned)
- [Future Development](#future-development)
- [Contributors](#contributors)

## Inspiration

The inspiration for NoteLab came from our own experience as students — constantly struggling to keep up with fast-talking professors while trying to stay focused and actually learn. We wanted to create a tool that would allow students to be present in lectures rather than frantically trying to transcribe everything being said.

## What NoteLab Does

NoteLab transforms the lecture experience by:

1. **Recording and transcribing** lecture audio in real-time
2. **Preserving your own notes** with precise timestamps tied to the lecture audio
3. **Enhancing your notes with AI** by adding images, references, and smart organization
4. **Keeping all lecture materials** (slides, audio, notes, transcripts) organized in one place

NoteLab isn't just a smarter notebook — it's your personal learning assistant that keeps you engaged and helps you learn better.

## Features

- **Real-time Audio Transcription**: Stay present in lectures while NoteLab records and transcribes automatically
- **Synchronized Timestamped Notes**: All notes are linked to specific moments in the lecture audio
- **AI-Enhanced Note Generation**: Transform basic notes into comprehensive study materials
- **Slide Integration**: Upload and view lecture slides alongside your notes
- **Organized Course Management**: Keep all lecture materials organized by course and lecture date
- **Download Options**: Export your notes, transcripts, and recordings in various formats

## How We Built It

### Frontend Development
We began by creating visual mockups to map the desired UI/UX flow. We then built the interface using Angular, integrating packages for:
- Notes editor
- Slide viewer
- Real-time audio transcription (powered by Deepgram)

### Backend Development
We developed a robust backend using FastAPI and MongoDB, creating endpoints and models for:
- Users
- Courses
- Lecture Materials (including titles, transcripts, slides, user notes, recordings, and AI-enhanced notes)

### AI/ML Integration
We leveraged Google Gemini to generate enriched user notes, refining our prompts using:
- Prompt chaining
- Few-shot learning
- Chain-of-thought reasoning

This allows us to create contextually aware notes that integrate both the lecture transcription and the user's original notes.

## Tech Stack

- **Frontend**: Angular
- **Backend**: FastAPI 
- **Database**: MongoDB
- **AI Services**: Google Gemini
- **Audio Transcription**: Deepgram
- **Containerization**: Docker

## Setup and Installation

To run NoteLab locally:

```bash
docker-compose up
```

This will spin up both the frontend Angular application and the backend FastAPI server.

## Challenges We Faced

During development, we encountered several key challenges:

- **Learning Curve**: Adapting to new frameworks like Angular
- **Large File Processing**: Handling audio files and PDFs on both the MongoDB backend and Angular frontend
- **AI Prompt Engineering**: Fine-tuning Google Gemini to accurately enhance user notes while also sourcing relevant images
- **Real-time Audio Processing**: Ensuring transcription worked smoothly and accurately

## Accomplishments

We're proud to have built a tool that truly supports students in their learning journey:

- Successfully implemented live audio transcription
- Created an AI system that effectively enhances user-generated notes
- Developed a platform that keeps all lecture materials organized in one place
- Built an intuitive interface that helps students focus on learning rather than note-taking

## What We Learned

Throughout this project, we gained valuable experience in:

- Prompt engineering and working with generative AI using Google Gemini
- Building with new frameworks like Angular for the frontend and FastAPI for the backend
- Audio processing and real-time transcription
- Creating an effective learning tool that addresses real student needs

## Future Development

We have ambitious plans for NoteLab's future:

- **Auto-generated Quizzes**: Create study quizzes based on users' notes and AI-enhanced content
- **Citation Features**: Link specific segments of lecture audio to citation references
- **AI Lecture Chatbot**: Develop a chatbot that helps users explore lecture topics more deeply by referencing and citing the professor's voice from the recorded audio
- **Collaboration Tools**: Allow students to share and collaborate on notes
- **Mobile Application**: Create a responsive mobile experience for on-the-go learning

## Contributors

NoteLab was created with passion by a team of students who understand the challenges of modern learning environments.


## Miscellaneous

![design v2](https://github.com/user-attachments/assets/dbf0dfb6-1583-4b79-8505-1407350fe3c0)

---

For questions or feedback, please open an issue in this repository.
