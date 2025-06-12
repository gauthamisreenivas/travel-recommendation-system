🧭 Travel Recommendation System
An intelligent hotel recommendation platform that provides users with personalized suggestions using content-based, collaborative, and hybrid filtering techniques. It features a modern, responsive frontend and a modular backend API.

🚀 Features
🔍 Personalized Recommendations

Content-based filtering

Collaborative filtering

Hybrid filtering

🖥️ Frontend

Built with TypeScript, React, and Tailwind CSS

Displays hotel cards with images, ratings, and names

Clean, intuitive interface inspired by GoHub UI templates

🧠 Backend

Developed in Python

Serves hotel recommendations via API

Preloaded with a realistic sample dataset (hotels + user ratings)

📁 Project Structure
bash
Copy
Edit
├── backend/          # Python Flask/Django/FastAPI backend (update accordingly)
├── frontend/         # React TypeScript frontend
├── .gitignore
├── .gitattributes
└── README.md
🛠️ Getting Started
1. Clone the repository
bash
Copy
Edit
git clone https://github.com/gauthamisreenivas/travel-recommendation-system.git
cd travel-recommendation-system
2. Start the backend
bash
Copy
Edit
cd backend
# (If using Flask)
pip install -r requirements.txt
python app.py
3. Start the frontend
bash
Copy
Edit
cd frontend
npm install
npm run dev
