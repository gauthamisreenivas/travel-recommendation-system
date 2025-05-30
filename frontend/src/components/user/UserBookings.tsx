import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Booking, Hotel } from '../../types';
import { format } from 'date-fns';

const UserBookings: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<(Booking & { hotel?: Hotel })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://127.0.0.1:5000/bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setBookings(response.data);
                setError(null);
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || err.message;
                setError(errorMessage);
                
                // If token is invalid, redirect to login
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [navigate]);

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/bookings/${bookingId}/cancel`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Update the booking status locally
            setBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking.id === bookingId
                        ? { ...booking, status: 'cancelled' }
                        : booking
                )
            );
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel booking');
        }
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

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="alert alert-info" role="alert">
                You haven't made any bookings yet.
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Your Bookings</h2>
            <div className="row g-4">
                {bookings.map(booking => (
                    <div key={booking.id} className="col-12">
                        <div className="card">
                            <div className="row g-0">
                                <div className="col-md-4">
                                    <img
                                        src={booking.hotel?.image_url}
                                        className="img-fluid rounded-start"
                                        alt={booking.hotel?.name}
                                        style={{ height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://via.placeholder.com/300x200?text=Hotel+Image';
                                        }}
                                    />
                                </div>
                                <div className="col-md-8">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h5 className="card-title">{booking.hotel?.name}</h5>
                                            <span className={`badge ${
                                                booking.status === 'confirmed' ? 'bg-success' :
                                                booking.status === 'cancelled' ? 'bg-danger' :
                                                'bg-warning'
                                            }`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="card-text">
                                            <small className="text-muted">
                                                <i className="bi bi-geo-alt"></i> {booking.hotel?.location}
                                            </small>
                                        </p>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <p className="mb-1">
                                                    <i className="bi bi-calendar-check me-2"></i>
                                                    Check-in: {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                                                </p>
                                                <p className="mb-1">
                                                    <i className="bi bi-calendar-x me-2"></i>
                                                    Check-out: {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1">
                                                    <i className="bi bi-people me-2"></i>
                                                    Guests: {booking.guests}
                                                </p>
                                                <p className="mb-1">
                                                    <i className="bi bi-currency-dollar me-2"></i>
                                                    Total: ${booking.total_price}
                                                </p>
                                            </div>
                                        </div>
                                        {booking.status === 'confirmed' && (
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleCancelBooking(booking.id)}
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserBookings; 