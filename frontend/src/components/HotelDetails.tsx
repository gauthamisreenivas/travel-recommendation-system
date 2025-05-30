import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/ImageStyles.module.css';

interface HotelType {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  amenities: string[];
  average_rating: number;
  room_types: {
    id: string;
    name: string;
    description: string;
    price_per_night: number;
    capacity: number;
    amenities: string[];
    image_url: string;
  }[];
}

const HotelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<HotelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const response = await fetch(`/hotels/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hotel details');
        }
        const data = await response.json();
        setHotel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!hotel) {
    return <Alert variant="info">Hotel not found</Alert>;
  }

  return (
    <div>
      <Card>
        <Card.Img
          variant="top"
          src={hotel.image_url}
          alt={hotel.name}
          className={styles.hotelDetailImage}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = 'https://placehold.co/800x300?text=Hotel+Image';
          }}
        />
        <Card.Body>
          <Card.Title className="h2">{hotel.name}</Card.Title>
          <Card.Text className="text-muted mb-3">
            <i className="bi bi-geo-alt"></i> {hotel.location}
          </Card.Text>
          <Card.Text>{hotel.description}</Card.Text>
          
          <div className="mb-4">
            <h5>Amenities</h5>
            <div className="d-flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <Badge key={amenity} bg="secondary">
                  {amenity.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Badge>
              ))}
            </div>
          </div>

          <h3>Room Types</h3>
          <Row xs={1} md={2} lg={3} className="g-4 mt-2">
            {hotel.room_types.map((room) => (
              <Col key={room.id}>
                <Card>
                  <Card.Img
                    variant="top"
                    src={room.image_url}
                    alt={room.name}
                    className={styles.roomImage}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://placehold.co/300x200?text=Room+Image';
                    }}
                  />
                  <Card.Body>
                    <Card.Title>{room.name}</Card.Title>
                    <Card.Text>{room.description}</Card.Text>
                    <div className="mb-3">
                      <strong>Amenities:</strong>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {room.amenities.map((amenity) => (
                          <Badge key={amenity} bg="info" className="me-1">
                            {amenity.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        <i className="bi bi-people"></i> Up to {room.capacity} guests
                      </div>
                      <div className="h5 mb-0">${room.price_per_night}/night</div>
                    </div>
                    <Link
                      to={`/book/${hotel.id}?roomType=${room.id}`}
                      className="btn btn-primary w-100 mt-3"
                    >
                      Book Now
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HotelDetails; 