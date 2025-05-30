import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Booking } from '../types';

const BookingSummary: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const booking = location.state?.booking as Booking;

    if (!booking) {
        return (
            <div className="container py-4">
                <div className="alert alert-warning">
                    No booking information available.
                    <button 
                        className="btn btn-link"
                        onClick={() => navigate('/')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="card">
                <div className="card-body">
                    <div className="text-center mb-4">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                        <h2 className="mt-2">Booking Confirmed!</h2>
                        <p className="text-muted">Your reservation has been successfully processed.</p>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <h4>Hotel Details</h4>
                            <div className="card mb-3">
                                <img
                                    src={booking.hotel?.image_url}
                                    className="card-img-top"
                                    alt={booking.hotel?.name}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/300x200?text=Hotel+Image';
                                    }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{booking.hotel?.name}</h5>
                                    <p className="card-text">
                                        <i className="bi bi-geo-alt"></i> {booking.hotel?.location}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <h4>Booking Details</h4>
                            <div className="card">
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h5>Room Type</h5>
                                        <p>{booking.room_type?.name}</p>
                                    </div>

                                    <div className="mb-3">
                                        <h5>Stay Duration</h5>
                                        <p>
                                            <i className="bi bi-calendar-check me-2"></i>
                                            Check-in: {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                                        </p>
                                        <p>
                                            <i className="bi bi-calendar-x me-2"></i>
                                            Check-out: {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <h5>Guests</h5>
                                        <p>
                                            <i className="bi bi-people me-2"></i>
                                            {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <h5>Payment</h5>
                                        <p>
                                            <i className="bi bi-currency-dollar me-2"></i>
                                            Total: ${booking.total_price}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <h5>Booking Status</h5>
                                        <span className={`badge ${
                                            booking.status === 'confirmed' ? 'bg-success' :
                                            booking.status === 'cancelled' ? 'bg-danger' :
                                            'bg-warning'
                                        }`}>
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            className="btn btn-primary me-2"
                            onClick={() => navigate('/bookings')}
                        >
                            View All Bookings
                        </button>
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate('/')}
                        >
                            Book Another Hotel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary; 