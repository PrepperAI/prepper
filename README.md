# Prepper

Prepper is an AI-native mock interview and presentation platform designed to simulate realistic, conversational interview environments using voice, multimodal context, conversational memory, and streaming avatars.

The broader goal behind Prepper was exploring how AI systems could create more human, immersive, and personalized coaching experiences rather than static chatbot interactions.

## Core Features

* Real-time voice conversations with AI interviewers
* Streaming AI avatars using HeyGen
* Behavioral interview mode
* Technical interview mode with live coding support
* System design interview mode with collaborative whiteboarding
* Presentation practice mode with slide-aware interaction
* Conversational memory and session continuity
* Personalized AI feedback generation
* Resume and job-description aware interviews
* Scheduled interview sessions
* Authentication and session persistence

---

# Motivation

A lot of existing interview-prep products feel transactional:

* static question banks,
* text-only chatbots,
* disconnected feedback,
* little emotional realism.

Prepper was built around the idea that preparation becomes significantly more effective when:

* conversations feel natural,
* the AI can speak and listen in real time,
* context persists across interactions,
* and users feel psychologically immersed in the experience.

The project also became an exploration into multimodal AI systems and AI-native user experiences more broadly.

---

# Architecture Overview

Prepper uses a React + TypeScript frontend and a FastAPI backend.

The system combines:

* real-time speech recognition,
* streaming text generation,
* text-to-speech,
* conversational memory,
* and avatar streaming.

## Frontend

* React
* TypeScript
* Monaco Editor
* Firebase Authentication
* PDF.js
* LiveKit integration
* CSS Modules

## Backend

* FastAPI
* Redis
* Firestore
* Azure Speech Services
* OpenAI / Claude APIs
* HeyGen Streaming Avatar SDK
* SendGrid

---

# Key System Components

## Real-Time Voice Pipeline

One of the major focuses of the project was reducing latency and making conversations feel natural.

The voice system included:

* Azure Speech-to-Text streaming
* sentence-aware transcription finalization
* low-latency conversational turn-taking
* interruption handling
* synchronized avatar speech playback

A major challenge was balancing:

* responsiveness,
* transcript accuracy,
* and conversational flow.

The system evolved toward finalizing responses only once complete thoughts or sentence boundaries were detected to reduce fragmented AI responses.

---

# Conversational Memory

Prepper maintains interview session state across interactions using:

* Redis session storage
* structured conversation history
* interview-type specific context
* resume-aware prompting
* job-description-aware prompting

This allowed the AI interviewer to:

* reference previous responses,
* maintain continuity,
* adapt follow-up questions,
* and generate more personalized feedback.

---

# Multimodal Presentation System

The presentation practice mode combined:

* PDF slide uploads,
* AI conversation,
* slide-aware context,
* and voice interaction.

The AI could:

* reference slide content,
* ask presentation questions,
* provide speaking feedback,
* and maintain conversational continuity while the user presented.

---

# Technical Interview System

The technical interview environment included:

* Monaco-based coding interface
* code snapshots
* AI-generated follow-up questions
* system design whiteboarding support
* structured evaluation flows

The platform emphasized reasoning and communication rather than purely algorithmic correctness.

---

# Key Engineering Challenges

## Latency Management

One of the biggest engineering challenges was minimizing conversational latency while coordinating:

* speech recognition,
* LLM generation,
* avatar streaming,
* and text-to-speech playback.

## Turn-Taking

Managing natural conversational interruption between:

* user speech,
* AI speech,
* and avatar playback
  required careful synchronization logic.

## Multimodal State Management

The system needed to maintain consistent session state across:

* voice,
* chat,
* coding environments,
* slides,
* and interview history.

## AI-Native UX

A major focus throughout the project was designing experiences that felt conversational and psychologically immersive rather than feeling like users were interacting with disconnected AI tools.

---

# AI-Assisted Engineering

A major theme throughout the project was exploring AI-native engineering workflows and how AI tooling could accelerate:

* iteration speed,
* debugging,
* architectural exploration,
* and prototyping,

while still maintaining strong human ownership over:

* system design,
* product decisions,
* architecture,
* and implementation tradeoffs.

---

# Future Directions

Potential future areas include:

* deeper long-term memory systems,
* emotion-aware conversational modeling,
* adaptive interview difficulty,
* collaborative multi-agent interviewers,
* and richer multimodal interaction patterns.

---

(Add repository link here)
