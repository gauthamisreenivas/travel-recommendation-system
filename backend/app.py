from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from the frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['travel_db']
hotels_collection = db['hotels']
user_ratings_collection = db['user_ratings']

def calculate_content_based_scores(location, amenities):
    """Calculate content-based similarity scores based on location and amenities."""
    hotels = list(hotels_collection.find({'location': location}))
    scores = []
    
    for hotel in hotels:
        # Calculate amenity match score
        hotel_amenities = set(hotel.get('amenities', []))
        requested_amenities = set(amenities)
        amenity_score = len(hotel_amenities.intersection(requested_amenities)) / len(requested_amenities) if requested_amenities else 1
        
        # Combine with rating
        rating_score = hotel.get('average_rating', 0) / 5.0
        final_score = 0.7 * amenity_score + 0.3 * rating_score
        scores.append((hotel, final_score))
    
    return sorted(scores, key=lambda x: x[1], reverse=True)

def calculate_collaborative_scores(hotel_ids):
    """Calculate collaborative filtering scores based on user ratings."""
    # This is a simplified collaborative filtering implementation
    # In a real system, you would use more sophisticated methods
    scores = {}
    for hotel_id in hotel_ids:
        ratings = list(user_ratings_collection.find({'hotel_id': hotel_id}))
        avg_rating = np.mean([r['rating'] for r in ratings]) if ratings else 0
        scores[hotel_id] = avg_rating
    return scores

@app.route('/recommend', methods=['POST'])
def recommend_hotels():
    data = request.get_json()
    location = data.get('location')
    amenities = data.get('amenities', [])
    
    if not location:
        return jsonify({'error': 'Location is required'}), 400
    
    # Get content-based recommendations
    content_recommendations = calculate_content_based_scores(location, amenities)
    
    # Get hotel IDs for collaborative filtering
    hotel_ids = [hotel['_id'] for hotel, _ in content_recommendations]
    collaborative_scores = calculate_collaborative_scores(hotel_ids)
    
    # Combine scores and prepare response
    final_recommendations = []
    for hotel, content_score in content_recommendations[:10]:  # Return top 10 hotels
        hotel_id = hotel['_id']
        collaborative_score = collaborative_scores.get(str(hotel_id), 0)
        
        # Combine scores (70% content-based, 30% collaborative)
        final_score = 0.7 * content_score + 0.3 * (collaborative_score / 5.0)
        
        hotel_data = {
            'id': str(hotel_id),
            'name': hotel.get('name'),
            'location': hotel.get('location'),
            'amenities': hotel.get('amenities', []),
            'average_rating': hotel.get('average_rating', 0),
            'image_url': hotel.get('image_url'),
            'score': final_score
        }
        final_recommendations.append(hotel_data)
    
    return jsonify(final_recommendations)

@app.route('/seed-data', methods=['POST'])
def seed_data():
    """Endpoint to seed sample data into MongoDB."""
    # Sample hotels data
    sample_hotels = [
        {
            'name': 'Luxury Beach Resort & Spa',
            'location': 'Miami',
            'amenities': ['pool', 'beach', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'room-service'],
            'average_rating': 4.8,
            'image_url': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        },
        {
            'name': 'Downtown Business Hotel',
            'location': 'New York',
            'amenities': ['gym', 'restaurant', 'business-center', 'wifi', 'bar', 'room-service', 'parking'],
            'average_rating': 4.5,
            'image_url': 'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8a'
        },
        {
            'name': 'Sunset Beach Inn',
            'location': 'Miami',
            'amenities': ['pool', 'beach', 'wifi', 'restaurant', 'parking'],
            'average_rating': 4.2,
            'image_url': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
        },
        {
            'name': 'The Grand Plaza',
            'location': 'New York',
            'amenities': ['gym', 'spa', 'restaurant', 'business-center', 'wifi', 'room-service', 'bar'],
            'average_rating': 4.7,
            'image_url': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
        },
        {
            'name': 'Hollywood Hills Resort',
            'location': 'Los Angeles',
            'amenities': ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking'],
            'average_rating': 4.6,
            'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
        },
        {
            'name': 'Beachfront Paradise',
            'location': 'Miami',
            'amenities': ['pool', 'beach', 'restaurant', 'bar', 'wifi', 'parking'],
            'average_rating': 4.3,
            'image_url': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d'
        },
        {
            'name': 'City Lights Hotel',
            'location': 'Las Vegas',
            'amenities': ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'room-service', 'parking'],
            'average_rating': 4.9,
            'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
        },
        {
            'name': 'Windy City Suites',
            'location': 'Chicago',
            'amenities': ['gym', 'restaurant', 'business-center', 'wifi', 'parking'],
            'average_rating': 4.1,
            'image_url': 'https://images.unsplash.com/photo-1518733057094-95b53143d2a7'
        },
        {
            'name': 'Bay Area Lodge',
            'location': 'San Francisco',
            'amenities': ['gym', 'restaurant', 'wifi', 'business-center', 'parking'],
            'average_rating': 4.2,
            'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
        },
        {
            'name': 'Strip View Casino Resort',
            'location': 'Las Vegas',
            'amenities': ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'room-service', 'parking', 'business-center'],
            'average_rating': 4.7,
            'image_url': 'https://images.unsplash.com/photo-1549109786-eb80da56e693'
        }
    ]
    
    # Sample user ratings data
    sample_ratings = [
        {'user_id': 'user1', 'hotel_id': 1, 'rating': 5},
        {'user_id': 'user1', 'hotel_id': 2, 'rating': 4},
        {'user_id': 'user2', 'hotel_id': 1, 'rating': 5},
        {'user_id': 'user2', 'hotel_id': 3, 'rating': 4},
        {'user_id': 'user3', 'hotel_id': 2, 'rating': 5},
        {'user_id': 'user3', 'hotel_id': 4, 'rating': 4},
        {'user_id': 'user4', 'hotel_id': 5, 'rating': 5},
        {'user_id': 'user4', 'hotel_id': 6, 'rating': 4},
        {'user_id': 'user5', 'hotel_id': 7, 'rating': 5},
        {'user_id': 'user5', 'hotel_id': 8, 'rating': 4}
    ]
    
    try:
        # Clear existing data
        hotels_collection.delete_many({})
        user_ratings_collection.delete_many({})
        
        # Insert new data
        hotels_result = hotels_collection.insert_many(sample_hotels)
        
        # Update ratings with actual hotel IDs
        for i, rating in enumerate(sample_ratings):
            rating['hotel_id'] = str(hotels_result.inserted_ids[rating['hotel_id'] - 1])
        
        user_ratings_collection.insert_many(sample_ratings)
        
        return jsonify({
            'message': 'Sample data seeded successfully',
            'hotels_added': len(sample_hotels),
            'ratings_added': len(sample_ratings)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 