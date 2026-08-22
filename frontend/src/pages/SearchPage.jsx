import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { globalSearch, searchCities, getActivities } from '../api/client';
import { Search, MapPin, Compass, ArrowRight, Activity } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all'; // all, cities, activities
  const sortBy = searchParams.get('sort_by') || '';
  
  const [searchInput, setSearchInput] = useState(query);
  
  const [results, setResults] = useState({ cities: [], trips: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query, type, sortBy);
    } else if (type === 'activities' || type === 'cities') {
      // If browsing a specific type without a query
      performSearch('', type, sortBy);
    }
  }, [query, type, sortBy]);

  const performSearch = async (q, searchType, sort) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      let data = { cities: [], trips: [], activities: [] };
      
      if (searchType === 'all' && q) {
        // Global search endpoint
        const globalRes = await globalSearch(q);
        data = { ...data, cities: globalRes.cities || [], trips: globalRes.trips || [] };
      } 
      else if (searchType === 'cities') {
        const params = {};
        if (q) params.search = q;
        if (sort) params.sort_by = sort;
        const res = await searchCities(params);
        data.cities = Array.isArray(res) ? res : res.items || [];
      }
      else if (searchType === 'activities') {
        const params = {};
        if (q) params.search = q;
        if (sort) params.sort_by = sort;
        const res = await getActivities(params);
        data.activities = Array.isArray(res) ? res : res.items || [];
      }

      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim(), type, sort_by: sortBy });
    }
  };

  const handleFilterChange = (newType, newSort) => {
    setSearchParams({ 
      q: searchInput, 
      type: newType || type, 
      sort_by: newSort !== undefined ? newSort : sortBy 
    });
  };

  const totalResults = results.cities.length + results.trips.length + results.activities.length;

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="page-header mb-6">
          <h1 className="page-title">Explore</h1>
          <p className="page-subtitle">Find your next destination or activity.</p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="search-filter-bar shadow-sm">
          <div className="search-filter-input-wrap">
            <Search className="navbar-search-icon" size={16} />
            <input 
              type="text" 
              className="search-filter-input border-none bg-surface" 
              placeholder="Search cities, activities..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          
          <select 
            className="search-filter-select border-none bg-surface"
            value={type}
            onChange={e => handleFilterChange(e.target.value, sortBy)}
          >
            <option value="all">Everything</option>
            <option value="cities">Cities</option>
            <option value="activities">Activities</option>
          </select>

          <select 
            className="search-filter-select border-none bg-surface"
            value={sortBy}
            onChange={e => handleFilterChange(type, e.target.value)}
          >
            <option value="">Sort by: Relevancy</option>
            <option value="popularity">Popularity</option>
            <option value="recent">Recent</option>
          </select>

          <button type="submit" className="btn btn-primary hide-mobile">Search</button>
        </form>

        {/* Results Area */}
        {loading ? (
          <div className="grid-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card h-64"></div>)}
          </div>
        ) : !hasSearched && !query && type === 'all' ? (
          <div className="empty-state bg-surface border border-border rounded-md mt-6">
            <Compass className="empty-state-icon" />
            <h3 className="empty-state-title">What are you looking for?</h3>
            <p className="empty-state-desc">Search for a city to visit, an activity to do, or browse public trips.</p>
          </div>
        ) : hasSearched && totalResults === 0 ? (
          <div className="empty-state bg-surface border border-border rounded-md mt-6">
            <Search className="empty-state-icon" />
            <h3 className="empty-state-title">No results found</h3>
            <p className="empty-state-desc">We couldn't find anything matching "{query}". Try adjusting your filters or search terms.</p>
            <button className="btn btn-outline mt-4" onClick={() => { setSearchInput(''); setSearchParams({ type: 'all' }); }}>Clear Search</button>
          </div>
        ) : (
          <div className="flex flex-col gap-10 mt-6">
            
            {results.cities.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4 flex items-center gap-2"><MapPin size={20} className="text-primary" /> Cities</h2>
                <div className="grid-4 gap-6">
                  {results.cities.map(city => (
                    <div key={city.id} className="city-card" onClick={() => navigate('/trips/new', { state: { cityId: city.id } })}>
                      <div className="city-card-img">
                        <img src={city.image_url || `https://source.unsplash.com/400x300/?${encodeURIComponent(city.name)}`} alt={city.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'; }} />
                        <div className="city-card-overlay"></div>
                        <div className="city-card-info">
                          <div className="city-card-name">{city.name}</div>
                          <div className="city-card-country">{city.country}</div>
                        </div>
                      </div>
                      <div className="city-card-body">
                        <span className="text-sm font-medium">Plan a trip here</span>
                        <ArrowRight size={16} className="text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.activities.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4 flex items-center gap-2"><Activity size={20} className="text-primary" /> Activities</h2>
                <div className="grid-3 gap-6">
                  {results.activities.map(activity => (
                    <div key={activity.id} className="card p-4 flex flex-col hover:-translate-y-1 transition-transform">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                          <Compass size={24} />
                        </div>
                        <span className="badge badge-neutral">{activity.category}</span>
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2">{activity.name}</h3>
                      <p className="text-sm text-secondary line-clamp-3 mb-4 flex-1">{activity.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <span className="font-medium text-text">Est. ${activity.estimated_cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.trips.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4 flex items-center gap-2"><Compass size={20} className="text-primary" /> Public Trips</h2>
                <div className="grid-3 gap-6">
                  {results.trips.map(trip => (
                    <div key={trip.id} className="trip-card" onClick={() => navigate(`/trips/${trip.id}`)}>
                      <div className="trip-card-img h-32">
                        <img src={trip.cover_photo_url || `https://source.unsplash.com/600x400/?travel,${encodeURIComponent(trip.name)}`} alt={trip.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} />
                      </div>
                      <div className="trip-card-body">
                        <div className="trip-card-title">{trip.name}</div>
                        <div className="text-xs text-secondary mt-2">By @{trip.user?.username || 'user'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
