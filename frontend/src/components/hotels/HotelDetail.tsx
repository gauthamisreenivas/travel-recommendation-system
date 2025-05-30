import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HotelDetailProps, RoomType, Booking } from '../../types';
import BookingForm from './BookingForm';

// Mapping of amenities to Bootstrap icons
const amenityIcons: { [key: string]: string } = {
    'pool': 'bi-water',
    'beach': 'bi-umbrella',
    'spa': 'bi-gem',
    'gym': 'bi-bicycle',
    'restaurant': 'bi-cup-hot',
    'bar': 'bi-cup-straw',
    'wifi': 'bi-wifi',
    'room-service': 'bi-bell',
    'parking': 'bi-p-square',
    'business-center': 'bi-briefcase',
    'laundry': 'bi-basket',
    'air-conditioning': 'bi-thermometer-half',
    'pet-friendly': 'bi-heart',
    'airport-shuttle': 'bi-truck'
};

const HotelDetail: React.FC<HotelDetailProps> = ({ hotel }) => {
    const navigate = useNavigate();
    const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Ensure room_types exists or default to empty array
    const roomTypes = hotel.room_types || [];
    
    // Sample additional images (in a real app, these would come from the API)
    const additionalImages = [
        hotel.image_url,
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80',
        'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8a?q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80'
    ].filter(Boolean); // Remove any undefined/null values

    const handleBooking = async (bookingData: Partial<Booking>) => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            // Implement booking logic here
            console.log('Booking data:', bookingData);
        } catch (error) {
            console.error('Error making booking:', error);
        }
    };

    const getAmenityIcon = (amenity: string) => {
        return amenityIcons[amenity] || 'bi-check-circle';
    };

    // Ensure amenities exists or default to empty array
    const amenities = hotel.amenities || [];

    return (
        <div className="container-fluid p-0">
            {/* Hero Section with Image Gallery */}
            <div className="position-relative">
                <div id="hotelCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                        {additionalImages.map((img, index) => (
                            <div key={index} className={`carousel-item ${index === activeImageIndex ? 'active' : ''}`}>
                                <img 
                                    src={img} 
                                    className="d-block w-100"
                                    alt={`${hotel.name} - View ${index + 1}`}
                                    style={{ height: '60vh', objectFit: 'cover' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/800x400?text=Hotel+Image';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {additionalImages.length > 1 && (
                        <>
                            <button className="carousel-control-prev" type="button" data-bs-target="#hotelCarousel" data-bs-slide="prev">
                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Previous</span>
                            </button>
                            <button className="carousel-control-next" type="button" data-bs-target="#hotelCarousel" data-bs-slide="next">
                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Next</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="container mt-4">
                <div className="row">
                    <div className="col-lg-8">
                        {/* Hotel Overview */}
                        <div className="card mb-4 border-0 shadow-sm">
                            <div className="card-body">
                                <h1 className="display-4 mb-2">{hotel.name}</h1>
                                <div className="d-flex align-items-center mb-3">
                                    <i className="bi bi-geo-alt text-primary me-2"></i>
                                    <span className="text-muted">{hotel.location}</span>
                                    <div className="ms-auto">
                                        <span className="badge bg-success me-2">
                                            <i className="bi bi-star-fill me-1"></i>
                                            {hotel.average_rating?.toFixed(1) || 'N/A'}
                                        </span>
                                        {hotel.score !== undefined && (
                                            <span className="badge bg-primary">
                                                <i className="bi bi-lightning-fill me-1"></i>
                                                {(hotel.score * 100).toFixed(0)}% Match
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="lead">{hotel.description || "Experience luxury and comfort in our carefully designed spaces, perfect for both business and leisure travelers."}</p>
                            </div>
                        </div>

                        {/* Amenities Section */}
                        {amenities.length > 0 && (
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-body">
                                    <h2 className="h3 mb-4">Amenities & Services</h2>
                                    <div className="row g-4">
                                        {amenities.map((amenity) => (
                                            <div key={amenity} className="col-md-6 col-lg-4">
                                                <div className="d-flex align-items-center">
                                                    <i className={`bi ${getAmenityIcon(amenity)} text-primary me-3 fs-4`}></i>
                                                    <span className="text-capitalize">
                                                        {amenity.split('-').join(' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Room Types */}
                        {roomTypes.length > 0 && (
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-body">
                                    <h2 className="h3 mb-4">Available Rooms</h2>
                                    <div className="row g-4">
                                        {roomTypes.map((room) => (
                                            <div key={room.id} className="col-12">
                                                <div className="card h-100 border shadow-sm">
                                                    <div className="row g-0">
                                                        <div className="col-md-4">
                                                            <img
                                                                src={room.image_url}
                                                                className="img-fluid h-100"
                                                                alt={room.name}
                                                                style={{ objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://via.placeholder.com/400x300?text=Room+Image';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="col-md-8">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <h3 className="h4 card-title">{room.name}</h3>
                                                                    <div className="text-end">
                                                                        <div className="fs-4 text-primary mb-2">
                                                                            ${room.price_per_night}
                                                                            <small className="text-muted fs-6">/night</small>
                                                                        </div>
                                                                        <button
                                                                            className="btn btn-primary"
                                                                            onClick={() => {
                                                                                setSelectedRoom(room);
                                                                                setShowBookingForm(true);
                                                                            }}
                                                                        >
                                                                            Book Now
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="card-text">{room.description}</p>
                                                                <div className="mt-3">
                                                                    <div className="row g-2">
                                                                        <div className="col-auto">
                                                                            <span className="badge bg-light text-dark">
                                                                                <i className="bi bi-people me-2"></i>
                                                                                Up to {room.capacity} guests
                                                                            </span>
                                                                        </div>
                                                                        {room.amenities?.map((amenity) => (
                                                                            <div key={amenity} className="col-auto">
                                                                                <span className="badge bg-light text-dark">
                                                                                    <i className={`bi ${getAmenityIcon(amenity)} me-2`}></i>
                                                                                    {amenity.split('-').join(' ')}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hotel Policies */}
                        <div className="card mb-4 border-0 shadow-sm">
                            <div className="card-body">
                                <h2 className="h3 mb-4">Hotel Policies</h2>
                                <div className="row">
                                    <div className="col-md-6">
                                        <h4 className="h5">Check-in/Check-out</h4>
                                        <ul className="list-unstyled">
                                            <li><i className="bi bi-clock me-2"></i>Check-in: 3:00 PM</li>
                                            <li><i className="bi bi-clock me-2"></i>Check-out: 11:00 AM</li>
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <h4 className="h5">House Rules</h4>
                                        <ul className="list-unstyled">
                                            <li><i className="bi bi-shield-check me-2"></i>Non-smoking rooms</li>
                                            <li><i className="bi bi-credit-card me-2"></i>Credit card required at check-in</li>
                                            <li><i className="bi bi-volume-down me-2"></i>Quiet hours: 10:00 PM - 7:00 AM</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form Sidebar */}
                    <div className="col-lg-4">
                        {showBookingForm && selectedRoom && (
                            <div className="sticky-top" style={{ top: '20px' }}>
                                <div className="card border-0 shadow">
                                    <div className="card-body">
                                        <h3 className="h4 mb-4">Book Your Stay</h3>
                                        <BookingForm
                                            hotel={hotel}
                                            roomType={selectedRoom}
                                            onSubmit={handleBooking}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelDetail; 