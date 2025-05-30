import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import SearchForm from './components/SearchForm';
import HotelList, { Hotel } from './components/HotelList';
import HotelDetails from './components/HotelDetails';
import UserBookings from './components/UserBookings';
import BookingForm from './components/BookingForm';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Hotel[]>([]);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await api.get('/hotels');
        setAllHotels(response.data);
        setSearchResults(response.data); // Initially show all hotels
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
    setSearchResults(results);
  };

  return (
    <div className="App">
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">Hotel Booking</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="/">Home</Nav.Link>
              {isAuthenticated ? (
                <>
                  <Nav.Link href="/bookings">My Bookings</Nav.Link>
                  <Nav.Link onClick={logout}>Logout</Nav.Link>
                  <span className="navbar-text ms-3">
                    Welcome, {user?.name}
                  </span>
                </>
              ) : (
                <>
                  <Nav.Link href="/login">Login</Nav.Link>
                  <Nav.Link href="/signup">Sign Up</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="py-4">
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <Container>
                  <div className="text-center">Loading hotels...</div>
                </Container>
              ) : error ? (
                <Container>
                  <div className="text-center text-danger">{error}</div>
                </Container>
              ) : (
                <Container>
                  <div className="search-section">
                    <SearchForm 
                      allHotels={allHotels}
                      onSearchResults={handleSearchResults} 
                    />
                  </div>
                  <HotelList searchResults={searchResults} />
                </Container>
              )
            }
          />
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route
            path="/book/:hotelId"
            element={
              <ProtectedRoute>
                <BookingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <UserBookings />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
