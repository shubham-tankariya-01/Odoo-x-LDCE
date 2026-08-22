import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTrips } from '../api/client';
import { Calendar, PlaneTakeoff, Search, Map, ArrowRight } from 'lucide-react';

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
      // By default fetch all, we will group client-side
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
        <div className="text-center p-6 bg-surface-2 rounded-md border border-dashed border-border text-muted text-sm">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid-3 gap-6">
        {items.map(trip => (
          <div key={trip.id} className="trip-card" onClick={() => navigate(`/trips/${trip.id}`)}>
            <div className="trip-card-img">
              <img src={trip.cover_photo_url || `https://source.unsplash.com/600x400/?travel,${encodeURIComponent(trip.name)}`} alt={trip.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} />
            </div>
            <div className="trip-card-body">
              <div className="trip-card-title">{trip.name}</div>
              <div className="trip-card-meta">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> 
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="trip-card-meta justify-between mt-3 pt-3 border-t border-border">
                <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                <span className="text-xs font-medium text-primary flex items-center gap-1">View Itinerary <ArrowRight size={12}/></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        
        <div className="page-header flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="page-title">My Trips</h1>
            <p className="page-subtitle">All your past, present, and future adventures.</p>
          </div>
          <Link to="/trips/new" className="btn btn-primary">
            <PlaneTakeoff size={16} /> Plan a New Trip
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-filter-input-wrap">
            <Search className="navbar-search-icon" size={16} />
            <input 
              type="text" 
              className="search-filter-input" 
              placeholder="Search your trips..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="search-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="grid-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card h-64"></div>)}
          </div>
        ) : trips.length === 0 && !search && statusFilter === 'all' ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Map size={32} /></div>
            <h3 className="empty-state-title">Your passport is empty</h3>
            <p className="empty-state-desc">You haven't planned any trips yet. Start building your first itinerary to see it here.</p>
            <Link to="/trips/new" className="btn btn-primary mt-4">Create your first trip</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {(statusFilter === 'all' || statusFilter === 'ongoing') && (
              <section>
                <div className="section-header mb-4">
                  <h2 className="section-title text-xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-ongoing"></span> Ongoing
                  </h2>
                </div>
                <TripGrid items={ongoing} emptyMessage="No ongoing trips right now." />
              </section>
            )}

            {(statusFilter === 'all' || statusFilter === 'upcoming') && (
              <section>
                <div className="section-header mb-4">
                  <h2 className="section-title text-xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-upcoming"></span> Upcoming
                  </h2>
                </div>
                <TripGrid items={upcoming} emptyMessage="No upcoming trips planned." />
              </section>
            )}

            {(statusFilter === 'all' || statusFilter === 'completed') && (
              <section>
                <div className="section-header mb-4">
                  <h2 className="section-title text-xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-completed"></span> Completed
                  </h2>
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
