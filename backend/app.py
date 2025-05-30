from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timedelta
from bson import ObjectId
import calendar
import random
import uuid

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['travel_db']
hotels_collection = db['hotels']
user_ratings_collection = db['user_ratings']
users_collection = db['users']
bookings_collection = db['bookings']

# Add this list of unique hotel images at the top of the file, after the imports
HOTEL_IMAGES = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',  # Luxury hotel exterior
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9',  # Modern hotel lobby
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791',  # Beachfront resort
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',  # Urban hotel
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',  # Mountain resort
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',  # Historic hotel
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',  # Boutique hotel
    'https://images.unsplash.com/photo-1561501900-3701fa6a0864',  # Spa resort
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',  # Luxury suite
    'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8a',  # Business hotel
    'https://images.unsplash.com/photo-1566073771259-6a8506099945',  # Modern hotel
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6',  # Resort pool
    'https://images.unsplash.com/photo-1518733057094-95b53143d2a7',  # Beach resort
    'https://images.unsplash.com/photo-1559599189-fe84dea4eb79',  # City hotel
    'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc',  # Boutique interior
    # Add more unique hotel images here...
]

# User ratings and reviews data structure
RATINGS_AND_REVIEWS = [
    {
        "id": str(uuid.uuid4()),
        "hotel_id": "1",
        "user_id": "user1",
        "user_name": "John Smith",
        "rating": 4.5,
        "review": "Excellent service and beautiful rooms. The breakfast was amazing!",
        "date": "2024-02-15"
    },
    {
        "id": str(uuid.uuid4()),
        "hotel_id": "1",
        "user_id": "user2",
        "user_name": "Emma Wilson",
        "rating": 5.0,
        "review": "Perfect stay! The staff was incredibly helpful and the facilities are top-notch.",
        "date": "2024-02-20"
    },
    {
        "id": str(uuid.uuid4()),
        "hotel_id": "2",
        "user_id": "user3",
        "user_name": "Michael Brown",
        "rating": 4.0,
        "review": "Great location and comfortable rooms. Could improve the Wi-Fi speed.",
        "date": "2024-02-18"
    },
    {
        "id": str(uuid.uuid4()),
        "hotel_id": "2",
        "user_id": "user4",
        "user_name": "Sarah Davis",
        "rating": 4.8,
        "review": "Stunning views and exceptional service. Will definitely come back!",
        "date": "2024-02-22"
    },
    {
        "id": str(uuid.uuid4()),
        "hotel_id": "3",
        "user_id": "user5",
        "user_name": "David Miller",
        "rating": 3.5,
        "review": "Decent stay but the rooms need updating. Good value for the price.",
        "date": "2024-02-10"
    }
]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 400
    
    user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'firstName': data['firstName'],
        'lastName': data['lastName'],
        'created_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = str(result.inserted_id)
    
    token = jwt.encode({
        'user_id': str(result.inserted_id),
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(result.inserted_id),
            'email': user['email'],
            'firstName': user['firstName'],
            'lastName': user['lastName']
        }
    })

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'firstName': user['firstName'],
            'lastName': user['lastName']
        }
    })

@app.route('/bookings', methods=['POST'])
def create_booking():
    """Create a new booking."""
    try:
        data = request.get_json()
        app.logger.info(f"Received booking request data: {data}")
        
        # Validate required fields
        required_fields = ['user_id', 'hotel_id', 'room_type_id', 'check_in', 'check_out', 'guests', 'total_price']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            app.logger.error(error_msg)
            return jsonify({'error': error_msg}), 400

        # Convert dates to UTC datetime objects
        try:
            check_in = datetime.fromisoformat(data['check_in'].replace('Z', '')).replace(tzinfo=None)
            check_out = datetime.fromisoformat(data['check_out'].replace('Z', '')).replace(tzinfo=None)
            current_time = datetime.utcnow()
        except ValueError as e:
            error_msg = f"Invalid date format: {str(e)}"
            return jsonify({'error': error_msg}), 400

        # Validate dates
        if check_in >= check_out:
            return jsonify({'error': 'Check-out date must be after check-in date'}), 400

        if check_in < current_time:
            return jsonify({'error': 'Check-in date cannot be in the past'}), 400

        # Get hotel details
        try:
            hotel = hotels_collection.find_one({'_id': ObjectId(data['hotel_id'])})
            if not hotel:
                return jsonify({'error': 'Hotel not found'}), 404
        except Exception as e:
            return jsonify({'error': f'Invalid hotel ID: {str(e)}'}), 400

        # Find room type
        room_type = next((rt for rt in hotel.get('room_types', []) if rt['id'] == data['room_type_id']), None)
        if not room_type:
            return jsonify({'error': 'Room type not found'}), 404

        # Check if there are enough rooms available
        existing_bookings = bookings_collection.count_documents({
            'hotel_id': data['hotel_id'],
            'room_type_id': data['room_type_id'],
            'status': 'confirmed',
            '$or': [
                {
                    'check_in': {'$lt': check_out},
                    'check_out': {'$gt': check_in}
                }
            ]
        })

        if existing_bookings >= room_type.get('total_rooms', 0):
            return jsonify({'error': 'No rooms available for the selected dates'}), 400

        # Create booking
        booking = {
            'user_id': data['user_id'],
            'hotel_id': str(data['hotel_id']),  # Convert to string
            'room_type_id': data['room_type_id'],
            'check_in': check_in,
            'check_out': check_out,
            'guests': data['guests'],
            'total_price': data['total_price'],
            'status': 'confirmed',
            'created_at': current_time,
            'room_type': room_type,
            'hotel': {
                'id': str(hotel['_id']),
                'name': hotel['name'],
                'location': hotel['location'],
                'image_url': hotel['image_url']
            }
        }
        
        result = bookings_collection.insert_one(booking)
        
        # Create a clean copy for the response
        booking_response = {
            'id': str(result.inserted_id),
            'user_id': booking['user_id'],
            'hotel_id': booking['hotel_id'],
            'room_type_id': booking['room_type_id'],
            'check_in': booking['check_in'].isoformat() + 'Z',
            'check_out': booking['check_out'].isoformat() + 'Z',
            'guests': booking['guests'],
            'total_price': booking['total_price'],
            'status': booking['status'],
            'created_at': booking['created_at'].isoformat() + 'Z',
            'room_type': booking['room_type'],
            'hotel': booking['hotel']
        }
        
        return jsonify({
            'message': 'Booking confirmed successfully',
            'booking': booking_response
        })
    except Exception as e:
        app.logger.error(f"Error in create_booking: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/bookings', methods=['GET'])
def get_user_bookings():
    """Get all bookings for a user."""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        bookings = list(bookings_collection.find({
            'user_id': user_id
        }).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for booking in bookings:
            booking['id'] = str(booking['_id'])
            del booking['_id']
            booking['check_in'] = booking['check_in'].isoformat() + 'Z'
            booking['check_out'] = booking['check_out'].isoformat() + 'Z'
            booking['created_at'] = booking['created_at'].isoformat() + 'Z'
        
        return jsonify(bookings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings/<booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    """Cancel a booking."""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        booking = bookings_collection.find_one({
            '_id': ObjectId(booking_id),
            'user_id': user_id
        })
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['status'] != 'confirmed':
            return jsonify({'error': 'Booking cannot be cancelled'}), 400
        
        # Update booking status
        bookings_collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': 'cancelled'}}
        )
        
        return jsonify({'message': 'Booking cancelled successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

@app.route('/hotels/<hotel_id>/availability', methods=['GET'])
def get_hotel_availability(hotel_id):
    """Get room availability for a specific hotel."""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            # If no dates provided, return availability for the next 30 days
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=30)
        else:
            try:
                # Remove timezone info and treat all times as UTC
                start_date = datetime.fromisoformat(start_date.replace('Z', '')).replace(tzinfo=None)
                end_date = datetime.fromisoformat(end_date.replace('Z', '')).replace(tzinfo=None)
            except ValueError as e:
                return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
        
        # Get hotel details
        try:
            hotel = hotels_collection.find_one({'_id': ObjectId(hotel_id)})
        except Exception as e:
            return jsonify({'error': f'Invalid hotel ID: {str(e)}'}), 400
            
        if not hotel:
            return jsonify({'error': 'Hotel not found'}), 404
        
        # Get all bookings for this hotel in the date range
        bookings = list(bookings_collection.find({
            'hotel_id': hotel_id,
            'status': 'confirmed',
            '$or': [
                {
                    'check_in': {'$lt': end_date},
                    'check_out': {'$gt': start_date}
                }
            ]
        }))
        
        # Calculate availability for each room type
        availability = {}
        for room_type in hotel.get('room_types', []):
            # Initialize availability calendar
            date_range = (end_date - start_date).days
            availability[room_type['id']] = {
                'room_type': room_type,
                'calendar': []
            }
            
            # For each date in range
            current_date = start_date
            while current_date <= end_date:
                # Count bookings for this room type on this date
                booked_rooms = sum(
                    1 for booking in bookings
                    if (booking['room_type_id'] == room_type['id'] and
                        booking['check_in'] <= current_date and
                        booking['check_out'] > current_date)
                )
                
                availability[room_type['id']]['calendar'].append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'available': room_type.get('total_rooms', 10) - booked_rooms,
                    'total_rooms': room_type.get('total_rooms', 10),
                    'price': room_type['price_per_night']
                })
                
                current_date += timedelta(days=1)
        
        return jsonify(availability)
    except Exception as e:
        app.logger.error(f"Error in get_hotel_availability: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/hotels', methods=['GET'])
def get_hotels():
    """Get hotels based on search criteria."""
    try:
        # Get query parameters
        location = request.args.get('location', '').strip()
        amenities = request.args.getlist('amenities')
        
        # Base query
        query = {}
        
        # Add location filter only if location is provided
        if location:
            query['location'] = {'$regex': location, '$options': 'i'}
            
        # Add amenities filter if amenities are provided
        if amenities:
            query['amenities'] = {'$all': amenities}
            
        # Get hotels from database
        hotels = list(hotels_collection.find(query))
        
        # Convert ObjectId to string for JSON serialization
        for hotel in hotels:
            hotel['id'] = str(hotel.pop('_id'))
            
        return jsonify(hotels)
        
    except Exception as e:
        app.logger.error(f"Error in get_hotels: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/hotels/<hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    """Get details for a specific hotel."""
    try:
        try:
            hotel = hotels_collection.find_one({'_id': ObjectId(hotel_id)})
        except Exception as e:
            return jsonify({'error': f'Invalid hotel ID: {str(e)}'}), 400
            
        if not hotel:
            return jsonify({'error': 'Hotel not found'}), 404
        
        # Convert ObjectId to string for JSON serialization
        hotel['id'] = str(hotel['_id'])
        del hotel['_id']
        
        return jsonify(hotel)
    except Exception as e:
        app.logger.error(f"Error in get_hotel: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/seed-data', methods=['POST'])
def seed_data():
    """Endpoint to seed sample data into MongoDB."""
    
    # Helper function to generate room types
    def generate_room_types(base_price, is_luxury=False):
        room_types = []
        
        # Standard Room
        room_types.append({
            'id': f'standard-{uuid.uuid4().hex[:8]}',
            'name': 'Standard Room',
            'description': 'Comfortable room with essential amenities',
            'price_per_night': base_price,
            'capacity': 2,
            'total_rooms': random.randint(10, 20),
            'amenities': ['wifi', 'tv', 'air-conditioning'],
            'image_url': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'
        })
        
        # Deluxe Room
        room_types.append({
            'id': f'deluxe-{uuid.uuid4().hex[:8]}',
            'name': 'Deluxe Room',
            'description': 'Spacious room with premium amenities and city views',
            'price_per_night': base_price * 1.5,
            'capacity': 2,
            'total_rooms': random.randint(8, 15),
            'amenities': ['wifi', 'tv', 'air-conditioning', 'mini-bar', 'city-view'],
            'image_url': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'
        })
        
        if is_luxury:
            # Suite
            room_types.append({
                'id': f'suite-{uuid.uuid4().hex[:8]}',
                'name': 'Luxury Suite',
                'description': 'Premium suite with separate living area and exclusive amenities',
                'price_per_night': base_price * 2.5,
                'capacity': 4,
                'total_rooms': random.randint(5, 10),
                'amenities': ['wifi', 'tv', 'air-conditioning', 'mini-bar', 'living-room', 'kitchen', 'premium-view'],
                'image_url': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'
            })
        
        return room_types

    # List of cities with their base price ranges
    cities = {
        'New York': (300, 800),
        'Los Angeles': (250, 600),
        'Chicago': (200, 500),
        'Miami': (250, 600),
        'Las Vegas': (150, 400),
        'San Francisco': (300, 700),
        'Boston': (250, 550),
        'Seattle': (200, 500),
        'Denver': (180, 450),
        'Austin': (170, 400)
    }

    # List of possible amenities
    amenities_pool = [
        'pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking',
        'room-service', 'business-center', 'conference-room', 'pet-friendly',
        'beach-access', 'ski-storage', 'golf-course', 'tennis-court',
        'kids-club', 'valet-parking', 'concierge', 'laundry'
    ]

    # Hotel themes/types
    hotel_types = [
        ('Resort', 'Luxurious resort with world-class amenities'),
        ('Boutique', 'Charming boutique hotel with personalized service'),
        ('Business', 'Modern hotel catering to business travelers'),
        ('Historic', 'Historic hotel with classic architecture'),
        ('Beach', 'Beachfront hotel with ocean views'),
        ('Mountain', 'Mountain lodge with scenic views'),
        ('Urban', 'Contemporary urban hotel in prime location'),
        ('Spa', 'Wellness-focused hotel with extensive spa facilities')
    ]

    # List of unique hotel name prefixes
    hotel_prefixes = ['The', 'Hotel', 'Grand', 'Royal', 'Elite', 'Premium', 'Luxury', 
                     'Majestic', 'Imperial', 'Regal', 'Sovereign', 'Noble', 'Elegant', 
                     'Prestigious', 'Classic']

    # List of unique hotel name suffixes
    hotel_suffixes = ['Plaza', 'Towers', 'Residences', 'Suites', 'Palace', 'House',
                     'Court', 'Lodge', 'Haven', 'Retreat', 'Estate', 'Manor', 'Gardens',
                     'Heights', 'Sanctuary']

    # Generate 50 hotels with unique names and images
    sample_hotels = []
    used_names = set()
    used_images = set()
    
    for i in range(50):
        city = random.choice(list(cities.keys()))
        base_price_range = cities[city]
        base_price = random.randint(base_price_range[0], base_price_range[1])
        hotel_type, description_base = random.choice(hotel_types)
        
        # Generate unique name
        while True:
            prefix = random.choice(hotel_prefixes)
            suffix = random.choice(hotel_suffixes)
            name = f"{prefix} {city} {suffix}"
            if name not in used_names:
                used_names.add(name)
                break

        # Select unique image
        available_images = [img for img in HOTEL_IMAGES if img not in used_images]
        if not available_images:  # If we run out of unique images, reset the pool
            used_images.clear()
            available_images = HOTEL_IMAGES
        
        image_url = random.choice(available_images)
        used_images.add(image_url)
        
        # Select random number of amenities (between 5 and 10)
        num_amenities = random.randint(5, 10)
        hotel_amenities = random.sample(amenities_pool, num_amenities)
        
        # Determine if it's a luxury hotel
        is_luxury = random.random() < 0.3  # 30% chance of being luxury
        
        hotel = {
            'name': name,
            'location': city,
            'description': f"{description_base} in the heart of {city}.",
            'amenities': hotel_amenities,
            'average_rating': round(random.uniform(3.5, 5.0), 1),
            'image_url': image_url,
            'room_types': generate_room_types(base_price, is_luxury)
        }
        
        sample_hotels.append(hotel)
    
    # Test user credentials - always the same for easy testing
    test_user = {
        'email': 'test@example.com',
        'password': generate_password_hash('test123'),  # Password: test123
        'firstName': 'Test',
        'lastName': 'User',
        'created_at': datetime.utcnow()
    }
    
    try:
        # Clear existing data
        hotels_collection.delete_many({})
        users_collection.delete_many({})
        bookings_collection.delete_many({})
        
        # Insert test user
        user_result = users_collection.insert_one(test_user)
        
        # Insert hotels
        hotels_result = hotels_collection.insert_many(sample_hotels)
        
        # Create sample bookings for test user
        sample_bookings = []
        
        # Create 2 random bookings for test user
        for _ in range(2):
            hotel = random.choice(sample_hotels)
            room_type = random.choice(hotel['room_types'])
            
            # Random dates in the next 30 days
            start_date = datetime.utcnow() + timedelta(days=random.randint(7, 20))
            end_date = start_date + timedelta(days=random.randint(1, 5))
            
            booking = {
                'user_id': str(user_result.inserted_id),
                'hotel_id': str(hotels_result.inserted_ids[sample_hotels.index(hotel)]),
                'room_type_id': room_type['id'],
                'check_in': start_date,
                'check_out': end_date,
                'guests': random.randint(1, room_type['capacity']),
                'total_price': room_type['price_per_night'] * (end_date - start_date).days,
                'status': 'confirmed',
                'created_at': datetime.utcnow()
            }
            sample_bookings.append(booking)
        
        # Insert bookings
        if sample_bookings:
            bookings_result = bookings_collection.insert_many(sample_bookings)
        
        return jsonify({
            'message': 'Sample data seeded successfully',
            'hotels_added': len(sample_hotels),
            'test_user': {
                'email': test_user['email'],
                'password': 'test123'  # Include the plain password in the response
            },
            'bookings_added': len(sample_bookings)
        })
    except Exception as e:
        app.logger.error(f"Error seeding data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/hotels/locations', methods=['GET'])
def get_locations():
    """Get available hotel locations based on search term."""
    try:
        search = request.args.get('search', '').strip()
        
        # If no search term, return all unique locations
        if not search:
            locations = hotels_collection.distinct('location')
            return jsonify(sorted(locations))
        
        # Find locations that match the search term (case-insensitive)
        locations = hotels_collection.distinct(
            'location',
            {'location': {'$regex': search, '$options': 'i'}}
        )
        
        return jsonify(sorted(locations))
    except Exception as e:
        app.logger.error(f"Error in get_locations: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add more ratings for each hotel
def generate_hotel_ratings(hotel_id, base_rating, num_reviews=5):
    reviews = []
    names = ["Alice Johnson", "Bob Wilson", "Carol Martinez", "Daniel Lee", "Eva Chen", 
             "Frank Taylor", "Grace Kim", "Henry Patel", "Isla Brown", "Jack Thompson"]
    review_texts = [
        "Absolutely loved my stay! The {amenity} was exceptional.",
        "Great experience overall. {amenity} could use some improvement.",
        "Wonderful hotel with amazing {amenity}. Staff was very helpful.",
        "Decent stay, but {amenity} exceeded expectations.",
        "Really impressed with the {amenity}. Will return!",
        "Good value for money. {amenity} was a highlight.",
        "Pleasant stay with excellent {amenity}.",
        "Above average experience. {amenity} needs updating.",
        "Fantastic hotel! {amenity} was world-class.",
        "Enjoyed my time here. {amenity} was particularly good."
    ]
    amenities = ["pool", "restaurant", "spa", "gym", "room service", "breakfast", "bar", "concierge service"]
    
    for i in range(num_reviews):
        # Generate a rating that varies around the base rating
        variation = (uuid.uuid4().int % 10 - 5) / 10  # Random variation between -0.5 and 0.5
        rating = min(max(base_rating + variation, 1), 5)  # Keep rating between 1 and 5
        
        reviews.append({
            "id": str(uuid.uuid4()),
            "hotel_id": hotel_id,
            "user_id": f"user_{uuid.uuid4().hex[:8]}",
            "user_name": names[i % len(names)],
            "rating": round(rating, 1),
            "review": review_texts[i % len(review_texts)].format(
                amenity=amenities[i % len(amenities)]
            ),
            "date": (datetime.now() - timedelta(days=i * 3)).strftime("%Y-%m-%d")
        })
    
    return reviews

# Hotel seed data
HOTELS = [
    {
        "id": "1",
        "name": "Luxury Grand Hotel",
        "location": "New York",
        "description": "Experience luxury at its finest in the heart of Manhattan.",
        "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        "average_rating": 4.7,
        "price_range": "$$$$",
        "amenities": ["pool", "spa", "gym", "restaurant", "bar", "wifi", "parking"],
        "room_types": [
            {
                "id": "deluxe-d125b58a",
                "name": "Deluxe Room",
                "description": "Spacious room with city view",
                "price_per_night": 350,
                "capacity": 2,
                "amenities": ["wifi", "minibar", "room-service"],
                "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
            },
            {
                "id": "suite-s789c12d",
                "name": "Executive Suite",
                "description": "Luxury suite with separate living area",
                "price_per_night": 550,
                "capacity": 3,
                "amenities": ["wifi", "minibar", "room-service", "jacuzzi"],
                "image_url": "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8a"
            }
        ],
        "reviews": []  # Will be populated with generated reviews
    },
    {
        "id": "2",
        "name": "Seaside Resort",
        "location": "Miami",
        "description": "Beachfront paradise with stunning ocean views.",
        "image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
        "average_rating": 4.5,
        "price_range": "$$$",
        "amenities": ["beach", "pool", "spa", "restaurant", "wifi", "parking"],
        "room_types": [
            {
                "id": "ocean-o456e78f",
                "name": "Ocean View Room",
                "description": "Room with beautiful ocean views",
                "price_per_night": 280,
                "capacity": 2,
                "amenities": ["wifi", "balcony", "room-service"],
                "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945"
            }
        ],
        "reviews": []
    },
    {
        "id": "3",
        "name": "Mountain Lodge",
        "location": "Denver",
        "description": "Cozy retreat in the Rocky Mountains.",
        "image_url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
        "average_rating": 4.3,
        "price_range": "$$",
        "amenities": ["fireplace", "hiking", "restaurant", "wifi", "parking"],
        "room_types": [
            {
                "id": "lodge-l901h23i",
                "name": "Lodge Room",
                "description": "Rustic room with mountain view",
                "price_per_night": 200,
                "capacity": 2,
                "amenities": ["wifi", "fireplace", "room-service"],
                "image_url": "https://images.unsplash.com/photo-1518733057094-95b53143d2a7"
            }
        ],
        "reviews": []
    }
]

# Generate and add reviews for each hotel
for hotel in HOTELS:
    hotel["reviews"] = generate_hotel_ratings(hotel["id"], hotel["average_rating"])
    # Recalculate average rating based on generated reviews
    if hotel["reviews"]:
        hotel["average_rating"] = round(sum(r["rating"] for r in hotel["reviews"]) / len(hotel["reviews"]), 1)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 