import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from '../styles/ImageStyles.module.css';

interface RoomType {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  image_url: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  amenities: string[];
  average_rating: number;
  room_types: RoomType[];
}

const BookingForm: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomTypeId = searchParams.get('roomType');

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const response = await fetch(`/hotels/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hotel details');
        }
        const data = await response.json();
        setHotel(data);
        
        // Set selected room type if provided in URL
        if (roomTypeId) {
          const room = data.room_types.find((r: RoomType) => r.id === roomTypeId);
          if (room) {
            setSelectedRoom(room);
            setGuests(1); // Default to 1 guest
          }
        }
      } catch (err) {
        console.error('Error fetching hotel:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, roomTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotel || !selectedRoom || !checkIn || !checkOut) {
      setError('Please fill in all required fields');
      return;
    }

    setBookingStatus('loading');
    try {
      const response = await fetch('/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'test_user_123',
          hotel_id: hotel.id,
          room_type_id: selectedRoom.id,
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          guests: guests,
          total_price: calculateTotalPrice(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      setBookingStatus('success');
      // Redirect to bookings page after successful booking
      navigate('/bookings');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      setBookingStatus('error');
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return selectedRoom.price_per_night * nights;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading booking details...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!hotel || !selectedRoom) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Hotel or room type not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Book Your Stay</h2>
      <div className="row">
        <div className="col-md-8">
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>{hotel.name}</Card.Title>
              <Card.Text>
                <i className="bi bi-geo-alt"></i> {hotel.location}
              </Card.Text>
              <div className="mb-3">
                <strong>Room Type:</strong> {selectedRoom.name}<br />
                <strong>Price per night:</strong> ${selectedRoom.price_per_night}<br />
                <strong>Max Guests:</strong> {selectedRoom.capacity}
              </div>
            </Card.Body>
          </Card>

          <Form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Check-in Date</Form.Label>
                  <DatePicker
                    selected={checkIn}
                    onChange={(date: Date | null) => setCheckIn(date)}
                    selectsStart
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={new Date()}
                    className="form-control"
                    placeholderText="Select check-in date"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Check-out Date</Form.Label>
                  <DatePicker
                    selected={checkOut}
                    onChange={(date: Date | null) => setCheckOut(date)}
                    selectsEnd
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={checkIn || new Date()}
                    className="form-control"
                    placeholderText="Select check-out date"
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Number of Guests</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={selectedRoom.capacity}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                required
              />
              <Form.Text className="text-muted">
                Maximum {selectedRoom.capacity} guests allowed for this room type
              </Form.Text>
            </Form.Group>

            {checkIn && checkOut && (
              <Alert variant="info" className="mb-3">
                Total Price: ${calculateTotalPrice()} for{' '}
                {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={bookingStatus === 'loading'}
              className="w-100"
            >
              {bookingStatus === 'loading' ? 'Creating Booking...' : 'Confirm Booking'}
            </Button>
          </Form>
        </div>

        <div className="col-md-4">
          <Card>
            <Card.Img
              variant="top"
              src={selectedRoom.image_url}
              alt={selectedRoom.name}
              className={styles.bookingImage}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = 'https://placehold.co/300x200?text=Room+Image';
              }}
            />
            <Card.Body>
              <Card.Title>{selectedRoom.name}</Card.Title>
              <Card.Text>{selectedRoom.description}</Card.Text>
              <div className="mb-3">
                <strong>Amenities:</strong>
                <ul className="list-unstyled mt-2">
                  {selectedRoom.amenities.map((amenity) => (
                    <li key={amenity}>
                      <i className="bi bi-check2 text-success"></i>{' '}
                      {amenity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default BookingForm; 