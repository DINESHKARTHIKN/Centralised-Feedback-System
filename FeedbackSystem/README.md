# Centralized Feedback System

A full-stack MERN application for collecting and analyzing feedback from students, teachers, alumni, and other stakeholders.

## Features
- **Role-Based Access Control**: Admin, Student, Teacher, Alumni, etc.
- **Dynamic Forms**: Admin can create forms with various question types (Star, Text, Yes/No).
- **Analytics Dashboard**: Real-time stats, sentiment analysis, and charts.
- **Secure**: JWT Authentication with bcrypt password hashing.

## Folder Structure
- `/server`: Node.js + Express + MongoDB Backend
- `/client`: React + Tailwind CSS + Vite Frontend

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally on standard port 27017

### Backend Setup
1. Navigate to server: `cd server`
2. Install dependencies: `npm install`
3. Create `.env` file (already provided) ensure MONGO_URI is correct.
4. Seed Admin User (Optional): `npm run seed`
   - Creates user `admin@college.edu` password `admin123`
5. Start Server: `npm run dev`

### Frontend Setup
1. Navigate to client: `cd client`
2. Install dependencies: `npm install`
3. Start Dev Server: `npm run dev`

### API Endpoints

#### Auth
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login user

#### Feedback
- `POST /api/feedback/create`: Create form (Admin)
- `GET /api/feedback/active`: Get active forms for user
- `POST /api/feedback/submit`: Submit feedback
- `GET /api/analytics/form/:id`: Get stats (Admin)

## Tech Stack
- MongoDB, Express, React, Node.js, TailwindCSS, Recharts, Framer Motion
