import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';

interface Booking {
  id: string;
  hotel: {
    id: string;
    name: string;
    location: string;
    image_url: string;
  };
  room_type: {
    name: string;
    price_per_night: number;
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
}

const UserBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/bookings?user_id=test_user_123`);
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/bookings/${bookingId}/cancel?user_id=test_user_123`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings after cancellation
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      );
      setBookings(updatedBookings);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading your bookings...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="text-center text-danger">{error}</div>
      </Container>
    );
  }

  if (!bookings.length) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h3>No bookings found</h3>
          <p>You haven't made any bookings yet.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Your Bookings</h2>
      <div className="d-flex flex-column gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <Card.Body>
              <div className="row">
                <div className="col-md-4">
                  <img
                    src={booking.hotel.image_url}
                    alt={booking.hotel.name}
                    className="img-fluid rounded"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://placehold.co/300x200?text=Hotel+Image';
                    }}
                  />
                </div>
                <div className="col-md-8">
                  <Card.Title>{booking.hotel.name}</Card.Title>
                  <Card.Text>
                    <i className="bi bi-geo-alt"></i> {booking.hotel.location}
                  </Card.Text>
                  <div className="mb-3">
                    <Badge bg={booking.status === 'confirmed' ? 'success' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <strong>Room Type:</strong> {booking.room_type.name}<br />
                    <strong>Check-in:</strong> {new Date(booking.check_in).toLocaleDateString()}<br />
                    <strong>Check-out:</strong> {new Date(booking.check_out).toLocaleDateString()}<br />
                    <strong>Guests:</strong> {booking.guests}<br />
                    <strong>Total Price:</strong> ${booking.total_price}
                  </div>
                  {booking.status === 'confirmed' && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default UserBookings; 