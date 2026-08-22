import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTrips } from '../api/client';
import { Calendar, PlaneTakeoff, Search, Map, ArrowRight, Filter } from 'lucide-react';

export function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await listTrips({ owner: 'me' }); 
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
    if (search && !trip.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ongoing = filteredTrips.filter(t => t.status === 'ongoing');
  const upcoming = filteredTrips.filter(t => t.status === 'upcoming');
  const completed = filteredTrips.filter(t => t.status === 'completed');

  const TripGrid = ({ items, emptyMessage }) => {
    if (items.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '32px' }}>
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="trips-grid">
        {items.map(trip => (
          <div key={trip.id} className="trips-card" onClick={() => navigate(`/trips/${trip.id}`)}>
            <div className="trips-card-img">
              <img src={trip.cover_photo_url || `https://source.unsplash.com/600x400/?travel,${encodeURIComponent(trip.name)}`} alt={trip.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} />
            </div>
            <div className="trips-card-body">
              <h3 className="trips-card-name">{trip.name}</h3>
              <div className="trips-card-dates">
                <Calendar size={16} /> 
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </div>
              <div className="trips-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span className={`badge badge-${trip.status === 'upcoming' ? 'info' : trip.status === 'ongoing' ? 'success' : 'neutral'}`}>
                  {trip.status}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trips/${trip.id}/budget`);
                    }}
                    title="View Cost & Budget Breakdown"
                  >
                    💰 Budget
                  </button>
                  <span className="trips-card-view">
                    View <ArrowRight size={14}/>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>
    );
  };

  return (
    <div className="page-wrap" style={{ backgroundColor: 'var(--color-surface-2)' }}>
      <div className="container">
        
        {/* Header */}
        <div className="trips-header">
          <div>
            <h1 className="page-title">My Trips</h1>
            <p className="page-subtitle">All your past, present, and future adventures.</p>
          </div>
          <Link to="/trips/new" className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-md)' }}>
            <PlaneTakeoff size={20} /> Plan a New Trip
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="trips-filter-bar">
          <div className="trips-filter-row">
            <div className="trips-search-wrap">
              <Search className="trips-search-icon" size={20} />
              <input 
                type="text" 
                className="trips-search-input" 
                placeholder="Search your trips..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="trips-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="trips-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }}></div>)}
          </div>
        ) : trips.length === 0 && !search && statusFilter === 'all' ? (
          <div className="empty-state">
            <Map size={64} className="empty-state-icon" />
            <h3 className="empty-state-title">Your passport is empty</h3>
            <p className="empty-state-desc">You haven't planned any trips yet. Start building your first itinerary to see it here.</p>
            <Link to="/trips/new" className="btn btn-primary btn-lg">
              Create your first trip
            </Link>
          </div>
        ) : (
          <div>
            {(statusFilter === 'all' || statusFilter === 'ongoing') && ongoing.length > 0 && (
              <section className="trips-section">
                <div className="trips-section-header">
                  <span className="trips-section-dot ongoing"></span>
                  <h2 className="trips-section-title">Ongoing</h2>
                </div>
                <TripGrid items={ongoing} emptyMessage="No ongoing trips right now." />
              </section>
            )}

            {(statusFilter === 'all' || statusFilter === 'upcoming') && (upcoming.length > 0 || (statusFilter === 'upcoming' && ongoing.length === 0 && completed.length === 0)) && (
              <section className="trips-section">
                <div className="trips-section-header">
                  <span className="trips-section-dot upcoming"></span>
                  <h2 className="trips-section-title">Upcoming</h2>
                </div>
                <TripGrid items={upcoming} emptyMessage="No upcoming trips planned." />
              </section>
            )}

            {(statusFilter === 'all' || statusFilter === 'completed') && completed.length > 0 && (
              <section className="trips-section">
                <div className="trips-section-header">
                  <span className="trips-section-dot completed"></span>
                  <h2 className="trips-section-title">Completed</h2>
                </div>
                <TripGrid items={completed} emptyMessage="No completed trips yet." />
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
