import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPopularCities, listTrips } from '../api/client';
import { MapPin, Calendar as CalendarIcon, ArrowRight, PlaneTakeoff } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    getPopularCities()
      .then(setCities)
      .catch(console.error)
      .finally(() => setLoadingCities(false));

    listTrips({ sort_by: 'recent', limit: 6 })
      .then(setRecentTrips)
      .catch(console.error)
      .finally(() => setLoadingTrips(false));
  }, []);

  const handleCityClick = (cityId) => {
    navigate('/trips/new', { state: { cityId } });
  };

  const handleTripClick = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  return (
    <div className="page-wrap" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="container">
        
        {/* Banner */}
        <div className="landing-hero group">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Travel banner" 
          />
          <div className="landing-hero-overlay"></div>
          <div className="landing-hero-content">
            <h1 className="landing-hero-title">Where to next?</h1>
            <p className="landing-hero-subtitle">Plan your perfect itinerary, manage budgets, and discover new destinations.</p>
            <Link to="/trips/new" className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <PlaneTakeoff size={24} />
              Plan a Trip
            </Link>
          </div>
        </div>

        <div>
          
          {/* Top Regional Selections */}
          <div className="landing-section-header">
            <h2 className="landing-section-title">Top Regional Selections</h2>
            <Link to="/search" className="landing-section-link">
              View all <ArrowRight size={18} />
            </Link>
          </div>
          
          {loadingCities ? (
            <div className="city-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-xl)' }}></div>
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="city-grid">
              {cities.slice(0, 4).map(city => (
                <div key={city.id} className="city-card" onClick={() => handleCityClick(city.id)}>
                  <img src={city.image_url || `https://source.unsplash.com/400x400/?${encodeURIComponent(city.name)}`} alt={city.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'; }} />
                  <div className="city-card-overlay"></div>
                  <div className="city-card-info">
                    <h3 className="city-card-name">{city.name}</h3>
                    <div className="city-card-country">
                      <MapPin size={16} /> {city.country}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <MapPin size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No popular cities found</h3>
              <p className="empty-state-desc">Check back later for trending destinations.</p>
            </div>
          )}

          <div className="landing-divider"></div>

          {/* Previous Trips */}
          <div className="landing-section-header">
            <h2 className="landing-section-title">Your Recent Trips</h2>
            <Link to="/trips" className="landing-section-link">
              View all <ArrowRight size={18} />
            </Link>
          </div>
          
          {loadingTrips ? (
            <div className="trip-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-md)' }}></div>
              ))}
            </div>
          ) : recentTrips.length > 0 ? (
            <div className="trip-grid">
              {recentTrips.map(trip => (
                <div key={trip.id} className="trip-card" onClick={() => handleTripClick(trip.id)}>
                  <div className="trip-card-img">
                    <img src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'} alt={trip.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} />
                  </div>
                  <div className="trip-card-body">
                    <h3 className="trip-card-title">{trip.name}</h3>
                    <div className="trip-card-meta">
                      <CalendarIcon size={18} />
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </div>
                    <span className={`badge badge-${trip.status === 'upcoming' ? 'info' : trip.status === 'ongoing' ? 'success' : 'neutral'}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <PlaneTakeoff size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No trips planned yet</h3>
              <p className="empty-state-desc">Start your first adventure today and keep track of your itinerary.</p>
              <Link to="/trips/new" className="btn btn-primary">
                Create a Trip
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
