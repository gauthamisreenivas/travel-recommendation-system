import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from '../styles/ImageStyles.module.css';

interface Hotel {
  id: string;
  name: string;
  location: string;
  image_url: string;
  average_rating: number;
  amenities: string[];
  score?: number;
}

interface HotelListProps {
  searchResults?: Hotel[];
}

const HotelList: React.FC<HotelListProps> = ({ searchResults }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If search results are provided, use them
    if (searchResults !== undefined) {
      setHotels(searchResults);
      setLoading(false);
      return;
    }

    // Otherwise fetch all hotels
    const fetchHotels = async () => {
      try {
        const response = await fetch('/hotels', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        setHotels(data);
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchResults]); // Add searchResults as a dependency

  const handleSearchResults = (results: Hotel[]) => {
    setHotels(results);
    setLoading(false);
    setError('');
  };

  if (loading) {
    return <div className="text-center">Loading hotels...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  if (!hotels.length) {
    return (
      <div className="text-center py-5">
        <h3>No hotels found</h3>
        <p>Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="g-4 hotel-grid">
        {hotels.map((hotel) => (
          <Col key={hotel.id} xs={12} md={6} lg={4}>
            <Card className="h-100">
              <Card.Img
                variant="top"
                src={hotel.image_url}
                alt={hotel.name}
                className={styles.hotelImage}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/300x200?text=Hotel+Image';
                }}
              />
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="mb-0">{hotel.name}</Card.Title>
                  {hotel.score !== undefined && (
                    <Badge 
                      bg={hotel.score > 0.8 ? 'success' : hotel.score > 0.6 ? 'primary' : 'secondary'}
                      className="ms-2"
                    >
                      {Math.round(hotel.score * 100)}% Match
                    </Badge>
                  )}
                </div>
                <Card.Text>
                  <i className="bi bi-geo-alt"></i> {hotel.location}
                  <br />
                  <i className="bi bi-star-fill text-warning"></i>{' '}
                  {hotel.average_rating.toFixed(1)}
                </Card.Text>
                <div className="mb-3">
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} bg="light" className="me-1">
                      {amenity}
                    </Badge>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <Badge bg="light">+{hotel.amenities.length - 3} more</Badge>
                  )}
                </div>
                <Link
                  to={`/hotel/${hotel.id}`}
                  className="btn btn-primary w-100"
                >
                  View Details
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export { HotelList, type Hotel };
export default HotelList; 