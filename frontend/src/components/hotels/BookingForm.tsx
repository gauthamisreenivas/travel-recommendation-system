import React, { useState } from 'react';
import { BookingFormProps } from '../../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../../services/api';

const BookingForm: React.FC<BookingFormProps> = ({ hotel, roomType, onSubmit }) => {
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [guests, setGuests] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculateTotalPrice = () => {
        if (!checkIn || !checkOut) return 0;
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return nights * roomType.price_per_night;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkIn || !checkOut) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to make a booking');
            }

            const bookingData = {
                hotelId: hotel.id,
                roomTypeId: roomType.id,
                checkIn: checkIn.toISOString(),
                checkOut: checkOut.toISOString(),
                guests,
                totalPrice: calculateTotalPrice()
            };

            const response = await api.post('/bookings', bookingData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                onSubmit(bookingData);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred while booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="booking-form">
            {error && (
                <div className="alert alert-danger mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <h5>{roomType.name}</h5>
                <p className="text-muted">${roomType.price_per_night} per night</p>
            </div>

            <div className="mb-3">
                <label className="form-label">Check-in Date</label>
                <DatePicker
                    selected={checkIn}
                    onChange={(date: Date | null) => setCheckIn(date)}
                    className="form-control"
                    minDate={new Date()}
                    placeholderText="Select check-in date"
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Check-out Date</label>
                <DatePicker
                    selected={checkOut}
                    onChange={(date: Date | null) => setCheckOut(date)}
                    className="form-control"
                    minDate={checkIn || new Date()}
                    placeholderText="Select check-out date"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="form-label">Number of Guests</label>
                <select
                    className="form-select"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    required
                >
                    {[...Array(roomType.capacity)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                        </option>
                    ))}
                </select>
            </div>

            {checkIn && checkOut && (
                <div className="card bg-light mb-4">
                    <div className="card-body">
                        <h6 className="card-title">Price Summary</h6>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Price per night</span>
                            <span>${roomType.price_per_night}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Number of nights</span>
                            <span>
                                {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))}
                            </span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span>${calculateTotalPrice()}</span>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading || !checkIn || !checkOut}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                    </>
                ) : (
                    'Confirm Booking'
                )}
            </button>

            <p className="mt-3 mb-0 text-muted small text-center">
                You won't be charged yet
            </p>
        </form>
    );
};

export default BookingForm; 