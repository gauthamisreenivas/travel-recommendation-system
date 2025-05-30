import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import SearchForm from './SearchForm';
import HotelList from './HotelList';
import { Hotel } from './HotelList';

const Home: React.FC = () => {
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load all hotels when component mounts
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('/hotels');
        if (!response.ok) {
          throw new Error('Failed to fetch hotels');
        }
        const data = await response.json();
        setAllHotels(data);
        setFilteredHotels(data); // Initially show all hotels
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const handleSearchResults = (results: Hotel[]) => {
    setFilteredHotels(results);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading hotels...</div>
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

  return (
    <Container className="py-4">
      <h1 className="mb-4">Find Your Perfect Hotel</h1>
      <SearchForm 
        allHotels={allHotels}
        onSearchResults={handleSearchResults}
      />
      <HotelList searchResults={filteredHotels} />
    </Container>
  );
};

export default Home; 