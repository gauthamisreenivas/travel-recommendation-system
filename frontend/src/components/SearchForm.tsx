import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, ListGroup } from 'react-bootstrap';

const AMENITIES = [
  'pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking',
  'room-service', 'business-center', 'pet-friendly'
];

interface Hotel {
  id: string;
  name: string;
  location: string;
  image_url: string;
  average_rating: number;
  amenities: string[];
  score?: number;
}

interface SearchFormProps {
  allHotels: Hotel[];
  onSearchResults: (hotels: Hotel[]) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ allHotels, onSearchResults }) => {
  const [location, setLocation] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [showLocations, setShowLocations] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);

  // Extract unique locations from allHotels
  useEffect(() => {
    const uniqueLocations = Array.from(new Set(allHotels.map(hotel => hotel.location))).sort();
    setLocations(uniqueLocations);
  }, [allHotels]);

  // Calculate relevance score based on ratings and location match
  const calculateScore = (hotel: Hotel, searchLocation: string): number => {
    if (!searchLocation) return 1;
    
    const locationMatch = hotel.location.toLowerCase() === searchLocation.toLowerCase();
    if (!locationMatch) return 0;

    // Calculate score based on rating (assuming max rating is 5)
    const ratingScore = hotel.average_rating / 5;
    
    // Combine location match and rating score
    // Location match is weighted more heavily (70%) than rating (30%)
    return locationMatch ? 0.7 + (0.3 * ratingScore) : 0;
  };

  // Filter hotels based on search criteria
  const filterHotels = (searchLocation: string, searchAmenities: string[]) => {
    let filteredHotels = [...allHotels];

    // Calculate scores and filter by location if provided
    filteredHotels = filteredHotels.map(hotel => ({
      ...hotel,
      score: calculateScore(hotel, searchLocation)
    })).filter(hotel => hotel.score > 0);

    // Sort by score (highest first)
    filteredHotels.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Filter by amenities if selected
    if (searchAmenities.length > 0) {
      filteredHotels = filteredHotels.filter(hotel =>
        searchAmenities.every(amenity => hotel.amenities.includes(amenity))
      );
    }

    onSearchResults(filteredHotels);
  };

  // Handle location suggestions
  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowLocations(value.length > 0);
    
    // Only filter if there's no location dropdown shown
    if (!showLocations) {
      filterHotels(value, selectedAmenities);
    }
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocations(false);
    filterHotels(selectedLocation, selectedAmenities);
  };

  const handleAmenityChange = (amenity: string) => {
    const updatedAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updatedAmenities);
    filterHotels(location, updatedAmenities);
  };

  const handleShowAllHotels = () => {
    setLocation('');
    setSelectedAmenities([]);
    onSearchResults(allHotels);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterHotels(location, selectedAmenities);
  };

  return (
    <Form className="mb-4" onSubmit={handleSearch}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by city"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => setShowLocations(true)}
            />
            {showLocations && locations.length > 0 && (
              <ListGroup className="position-absolute w-100 mt-1 z-1000">
                {locations
                  .filter(loc => loc.toLowerCase().includes(location.toLowerCase()))
                  .map((loc) => (
                    <ListGroup.Item
                      key={loc}
                      action
                      onClick={() => handleLocationSelect(loc)}
                      className="cursor-pointer"
                    >
                      {loc}
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            )}
          </Form.Group>
        </Col>
        <Col md={3}>
          <Button type="submit" variant="primary" className="w-100 h-100">
            Search Hotels
          </Button>
        </Col>
        <Col md={3}>
          <Button variant="outline-primary" onClick={handleShowAllHotels} className="w-100 h-100">
            Show All Hotels
          </Button>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <Form.Label>Amenities</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => (
              <Form.Check
                key={amenity}
                type="checkbox"
                id={`amenity-${amenity}`}
                label={amenity}
                checked={selectedAmenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="me-3"
              />
            ))}
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
    </Form>
  );
};

export default SearchForm; 