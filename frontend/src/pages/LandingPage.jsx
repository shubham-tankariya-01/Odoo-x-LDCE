import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPopularCities, listTrips } from '../api/client';
import { MapPin, Calendar as CalendarIcon, ArrowRight, PlaneTakeoff, Loader2 } from 'lucide-react';

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
    <div className="page-wrapper">
      <div className="container">
        
        {/* Banner */}
        <div className="hero-banner">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Travel banner" 
            className="hero-banner-bg"
          />
          <div className="hero-banner-overlay"></div>
          <div className="hero-banner-content">
            <h1 className="hero-banner-title">Where to next?</h1>
            <p className="hero-banner-subtitle">Plan your perfect itinerary, manage budgets, and discover new destinations.</p>
            <Link to="/trips/new" className="btn btn-primary btn-lg">
              <PlaneTakeoff size={20} />
              Plan a Trip
            </Link>
          </div>
        </div>

        <div className="page-content pt-0">
          
          {/* Top Regional Selections */}
          <div className="section-header">
            <h2 className="section-title">Top Regional Selections</h2>
            <Link to="/search" className="btn btn-ghost">View all <ArrowRight size={16} /></Link>
          </div>
          
          {loadingCities ? (
            <div className="grid-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton skeleton-card"></div>
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="grid-4 gap-6">
              {cities.slice(0, 4).map(city => (
                <div key={city.id} className="city-card" onClick={() => handleCityClick(city.id)}>
                  <div className="city-card-img">
                    <img src={city.image_url || `https://source.unsplash.com/400x300/?${encodeURIComponent(city.name)}`} alt={city.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'; }} />
                    <div className="city-card-overlay"></div>
                    <div className="city-card-info">
                      <div className="city-card-name">{city.name}</div>
                      <div className="city-card-country">{city.country}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <MapPin className="empty-state-icon" />
              <h3 className="empty-state-title">No popular cities found</h3>
              <p className="empty-state-desc">Check back later for trending destinations.</p>
            </div>
          )}

          <div className="divider" style={{ margin: 'var(--space-12) 0' }}></div>

          {/* Previous Trips */}
          <div className="section-header">
            <h2 className="section-title">Your Recent Trips</h2>
            <Link to="/trips" className="btn btn-ghost">View all <ArrowRight size={16} /></Link>
          </div>
          
          {loadingTrips ? (
            <div className="grid-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton skeleton-card"></div>
              ))}
            </div>
          ) : recentTrips.length > 0 ? (
            <div className="grid-3 gap-6">
              {recentTrips.map(trip => (
                <div key={trip.id} className="trip-card" onClick={() => handleTripClick(trip.id)}>
                  <div className="trip-card-img">
                    <img src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'} alt={trip.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} />
                  </div>
                  <div className="trip-card-body">
                    <div className="trip-card-title">{trip.name}</div>
                    <div className="trip-card-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={14} /> 
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="trip-card-meta">
                      <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon"><PlaneTakeoff size={32} /></div>
              <h3 className="empty-state-title">No trips planned yet</h3>
              <p className="empty-state-desc">Start your first adventure today.</p>
              <Link to="/trips/new" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Create a Trip</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
