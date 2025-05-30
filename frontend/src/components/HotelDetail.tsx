import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Hotel, RoomAvailability, RoomType } from '../types';

const defaultHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

const HotelDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [guests, setGuests] = useState(1);
    const [selectedRoomType, setSelectedRoomType] = useState<string>('');
    const [availability, setAvailability] = useState<Record<string, RoomAvailability>>({});
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [bookingError, setBookingError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHotelDetails = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:5000/hotels/${id}`);
                setHotel(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch hotel details');
            } finally {
                setLoading(false);
            }
        };

        fetchHotelDetails();
    }, [id]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!checkIn || !checkOut) return;

            try {
                const response = await axios.get(`http://127.0.0.1:5000/hotels/${id}/availability`, {
                    params: {
                        start_date: checkIn.toISOString(),
                        end_date: checkOut.toISOString()
                    }
                });
                setAvailability(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch availability');
            }
        };

        if (checkIn && checkOut) {
            fetchAvailability();
        }
    }, [id, checkIn, checkOut]);

    const handleBooking = async () => {
        if (!hotel || !checkIn || !checkOut || !selectedRoomType) {
            setBookingError('Please select all required booking details');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: `/hotel/${hotel.id}` } });
            return;
        }

        setBookingStatus('loading');
        setBookingError(null);

        try {
            // Calculate total price
            const roomType = hotel.room_types.find(rt => rt.id === selectedRoomType);
            if (!roomType) {
                throw new Error('Selected room type not found');
            }

            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const totalPrice = roomType.price_per_night * nights;

            // Ensure dates are in UTC ISO format
            const bookingData = {
                hotel_id: hotel.id,
                room_type_id: selectedRoomType,
                check_in: checkIn.toISOString(),
                check_out: checkOut.toISOString(),
                guests: Number(guests),
                total_price: Number(totalPrice.toFixed(2))
            };

            console.log('Sending booking request:', bookingData);

            const response = await axios.post('http://127.0.0.1:5000/bookings', bookingData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setBookingStatus('success');
            navigate('/booking-summary', { state: { booking: response.data.booking } });
        } catch (err: any) {
            setBookingStatus('error');
            console.error('Booking error:', err);

            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login', { state: { from: `/hotel/${hotel.id}` } });
                return;
            }

            let errorMessage = 'An error occurred while processing your booking.';
            
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message === 'Network Error') {
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setBookingError(errorMessage);
            
            // Scroll to error message
            const errorElement = document.getElementById('booking-error');
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const isRoomAvailable = (roomType: RoomType): boolean => {
        if (!checkIn || !checkOut || !availability[roomType.id]) return false;

        const calendar = availability[roomType.id].calendar;
        return calendar.every(day => day.available > 0);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !hotel) {
        return (
            <div className="alert alert-danger" role="alert">
                {error || 'Hotel not found'}
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-md-8">
                    <h1>{hotel.name}</h1>
                    <p className="text-muted">
                        <i className="bi bi-geo-alt"></i> {hotel.location}
                    </p>
                    <div className="hotel-image-container" style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden', borderRadius: '8px' }}>
                        <img
                            src={hotel.image_url || defaultHotelImage}
                            alt={hotel.name}
                            className="w-100 h-100"
                            style={{ 
                                objectFit: 'cover',
                                objectPosition: 'center'
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== defaultHotelImage) {
                                    target.src = defaultHotelImage;
                                }
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        <h3>About</h3>
                        <p>{hotel.description}</p>
                    </div>
                    <div className="mb-4">
                        <h3>Amenities</h3>
                        <div className="d-flex flex-wrap gap-2">
                            {hotel.amenities.map(amenity => (
                                <span key={amenity} className="badge bg-secondary">
                                    <i className={`bi bi-${getAmenityIcon(amenity)} me-1`}></i>
                                    {formatAmenityName(amenity)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h3 className="card-title">Book Your Stay</h3>
                            <div className="mb-3">
                                <label className="form-label">Check-in</label>
                                <DatePicker
                                    selected={checkIn}
                                    onChange={date => setCheckIn(date)}
                                    className="form-control"
                                    minDate={new Date()}
                                    placeholderText="Select check-in date"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Check-out</label>
                                <DatePicker
                                    selected={checkOut}
                                    onChange={date => setCheckOut(date)}
                                    className="form-control"
                                    minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
                                    placeholderText="Select check-out date"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Guests</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                    min={1}
                                    max={10}
                                />
                            </div>
                            {checkIn && checkOut && (
                                <div className="mb-3">
                                    <label className="form-label">Room Type</label>
                                    {hotel.room_types.map(roomType => (
                                        <div key={roomType.id} className="card mb-2">
                                            <div className="card-body">
                                                <h5 className="card-title">{roomType.name}</h5>
                                                <p className="card-text">
                                                    <small className="text-muted">{roomType.description}</small>
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong className="text-primary">
                                                            ${roomType.price_per_night}
                                                        </strong>
                                                        <small className="text-muted"> / night</small>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            type="radio"
                                                            className="form-check-input"
                                                            name="roomType"
                                                            value={roomType.id}
                                                            checked={selectedRoomType === roomType.id}
                                                            onChange={() => setSelectedRoomType(roomType.id)}
                                                            disabled={!isRoomAvailable(roomType)}
                                                        />
                                                        <label className="form-check-label">
                                                            {isRoomAvailable(roomType) ? 'Available' : 'Not Available'}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {bookingError && (
                                <div 
                                    id="booking-error" 
                                    className="alert alert-danger mb-3" 
                                    role="alert"
                                >
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        <div>
                                            <h6 className="alert-heading mb-1">Booking Error</h6>
                                            <p className="mb-0">{bookingError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleBooking}
                                disabled={bookingStatus === 'loading' || !selectedRoomType}
                            >
                                {bookingStatus === 'loading' ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Processing...
                                    </>
                                ) : 'Book Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getAmenityIcon = (amenity: string): string => {
    const iconMap: Record<string, string> = {
        'wifi': 'wifi',
        'pool': 'water',
        'gym': 'bicycle',
        'spa': 'heart-pulse',
        'restaurant': 'cup-hot',
        'bar': 'cup',
        'room-service': 'bell',
        'parking': 'car-front',
        'beach': 'umbrella',
        'business-center': 'briefcase',
        'laundry': 'basket',
        'air-conditioning': 'thermometer-half'
    };

    return iconMap[amenity] || 'check-circle';
};

const formatAmenityName = (amenity: string): string => {
    return amenity
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default HotelDetail; 