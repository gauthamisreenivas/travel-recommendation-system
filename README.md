# Travel Recommendation System

A full-stack application that provides personalized hotel recommendations based on location and amenities preferences. Built with React, Flask, and MongoDB.

## Features

- Location-based hotel search
- Multiple amenity selection
- Hybrid recommendation system combining content-based and collaborative filtering
- Responsive and modern UI using Bootstrap
- Real-time recommendations

## Tech Stack

- Frontend: React with TypeScript
- Backend: Flask
- Database: MongoDB
- Styling: Bootstrap 5

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-recommendation-system
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up MongoDB:
- Make sure MongoDB is running locally
- Create a database named 'travel_db'
- Use the /seed-data endpoint to populate sample data

4. Set up the frontend:
```bash
cd ../frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/
```

## API Endpoints

- POST `/recommend`: Get hotel recommendations
  - Request body: `{ "location": string, "amenities": string[] }`
  - Response: Array of hotel objects

- POST `/seed-data`: Populate the database with sample data
  - Response: Success message

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 