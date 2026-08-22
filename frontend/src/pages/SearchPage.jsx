import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { globalSearch, searchCities, getActivities, getCountries, listTrips, createSection } from '../api/client';
import { 
  Search, 
  MapPin, 
  Compass, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Calendar,
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'cities'; 
  const countryParam = searchParams.get('country') || 'all';
  const costParam = searchParams.get('cost') || 'all';
  const sortBy = searchParams.get('sort_by') || 'popularity';
  
  const [searchInput, setSearchInput] = useState(query);
  const [countries, setCountries] = useState([]);
  
  const [results, setResults] = useState({ cities: [], trips: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Add to Trip Modal state
  const [selectedCityForTrip, setSelectedCityForTrip] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [addingToTripId, setAddingToTripId] = useState(null);
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');

  // Load countries on mount
  useEffect(() => {
    getCountries().then(list => {
      setCountries(Array.isArray(list) ? list : []);
    }).catch(console.error);
  }, []);

  // Trigger search on params change
  useEffect(() => {
    setSearchInput(query);
    performSearch(query, type, countryParam, costParam, sortBy);
  }, [query, type, countryParam, costParam, sortBy]);

  const performSearch = async (q, searchType, country, cost, sort) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      let data = { cities: [], trips: [], activities: [] };
      
      if (searchType === 'cities') {
        const params = {};
        if (q) params.search = q;
        if (country && country !== 'all') params.country = country;
        if (sort) params.sort_by = sort;
        
        if (cost === 'budget') {
          params.max_cost = 1.3;
        } else if (cost === 'moderate') {
          params.min_cost = 1.3;
          params.max_cost = 2.0;
        } else if (cost === 'luxury') {
          params.min_cost = 2.0;
        }

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
      else if (searchType === 'all') {
        if (q) {
          const globalRes = await globalSearch(q);
          data = { ...data, cities: globalRes.cities || [], trips: globalRes.trips || [] };
        } else {
          const citiesRes = await searchCities({ sort_by: 'popularity' });
          data.cities = Array.isArray(citiesRes) ? citiesRes.slice(0, 8) : [];
        }
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
    updateQueryParams({ q: searchInput.trim() });
  };

  const updateQueryParams = (updates = {}) => {
    const current = {
      q: searchInput,
      type,
      country: countryParam,
      cost: costParam,
      sort_by: sortBy,
      ...updates
    };
    
    // Remove empty params
    Object.keys(current).forEach(key => {
      if (!current[key] || current[key] === 'all') {
        if (key !== 'type' && key !== 'q') delete current[key];
      }
    });

    setSearchParams(current);
  };

  const openAddToTripModal = async (city) => {
    setSelectedCityForTrip(city);
    setModalSuccessMsg('');
    setLoadingTrips(true);
    try {
      const trips = await listTrips({ owner: 'me' });
      setUserTrips(Array.isArray(trips) ? trips : []);
    } catch (err) {
      console.error("Failed to load user trips", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleAddCityToExistingTrip = async (trip) => {
    if (!selectedCityForTrip) return;
    setAddingToTripId(trip.id);
    try {
      const sDate = trip.start_date ? trip.start_date.split('T')[0] : '';
      const eDate = trip.end_date ? trip.end_date.split('T')[0] : sDate;

      await createSection(trip.id, {
        city_id: selectedCityForTrip.id,
        title: `${selectedCityForTrip.name} Leg`,
        start_date: sDate,
        end_date: eDate,
        description: `Explore ${selectedCityForTrip.name}, ${selectedCityForTrip.country || ''}`,
        budget: 0
      });

      setModalSuccessMsg(`Added ${selectedCityForTrip.name} to "${trip.name}"!`);
      setTimeout(() => {
        navigate(`/trips/${trip.id}/build`);
      }, 750);
    } catch (err) {
      console.error("Failed to add section", err);
      alert(err.message || "Failed to add city to trip");
    } finally {
      setAddingToTripId(null);
    }
  };

  const handleStartNewTripWithCity = (city) => {
    navigate('/trips/new', { state: { cityId: city.id } });
  };

  const getCostLevelLabel = (costIndex) => {
    const val = parseFloat(costIndex) || 1.0;
    if (val <= 1.2) return { label: 'Budget Friendly', icon: '$', color: 'badge-success' };
    if (val <= 1.9) return { label: 'Moderate Cost', icon: '$$', color: 'badge-info' };
    return { label: 'Premium / Luxury', icon: '$$$', color: 'badge-warning' };
  };

  const totalResults = results.cities.length + results.trips.length + results.activities.length;

  return (
    <div className="search-page">
      <div className="container">
        
        <div className="search-header">
          <h1 className="search-title">Discover & Explore Cities</h1>
          <p className="search-subtitle">Search cities worldwide with cost indexes and popularity metrics, and seamlessly add them to your trip itinerary.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <div className="search-bar-input-wrap">
            <Search className="search-bar-icon" size={22} />
            <input 
              type="text" 
              className="search-bar-input" 
              placeholder="Search by city name, country, or destination..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="search-tabs">
          <button 
            className={`search-tab ${type === 'cities' ? 'active' : ''}`}
            onClick={() => updateQueryParams({ type: 'cities' })}
          >
            <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Cities
          </button>
          <button 
            className={`search-tab ${type === 'activities' ? 'active' : ''}`}
            onClick={() => updateQueryParams({ type: 'activities' })}
          >
            <Activity size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Activities
          </button>
          <button 
            className={`search-tab ${type === 'all' ? 'active' : ''}`}
            onClick={() => updateQueryParams({ type: 'all' })}
          >
            <Compass size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> All & Trips
          </button>
        </div>

        {/* Dynamic Controls Bar for Cities */}
        {type === 'cities' && (
          <div className="search-controls-bar">
            {/* Country filter */}
            <select 
              className="search-filter-select"
              value={countryParam}
              onChange={e => updateQueryParams({ country: e.target.value })}
            >
              <option value="all">🌍 All Countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Cost Index filter */}
            <select 
              className="search-filter-select"
              value={costParam}
              onChange={e => updateQueryParams({ cost: e.target.value })}
            >
              <option value="all">💰 All Cost Indexes</option>
              <option value="budget">💵 Budget Friendly (≤ 1.3x)</option>
              <option value="moderate">💳 Moderate (1.3x – 2.0x)</option>
              <option value="luxury">💎 Luxury (≥ 2.0x)</option>
            </select>

            {/* Sort by filter */}
            <select 
              className="search-filter-select"
              value={sortBy}
              onChange={e => updateQueryParams({ sort_by: e.target.value })}
            >
              <option value="popularity">🔥 Sort: Most Popular</option>
              <option value="cost_low">💵 Sort: Cost (Low to High)</option>
              <option value="cost_high">💎 Sort: Cost (High to Low)</option>
              <option value="name">🔤 Sort: Name (A-Z)</option>
            </select>
          </div>
        )}

        {/* Results Area */}
        {loading ? (
          <div className="search-city-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton search-skeleton"></div>)}
          </div>
        ) : hasSearched && totalResults === 0 ? (
          <div className="empty-state" style={{ background: 'var(--color-surface)', padding: '48px 24px', borderRadius: 'var(--radius-xl)' }}>
            <Search size={56} className="empty-state-icon" style={{ color: 'var(--color-primary)' }} />
            <h3 className="empty-state-title">No matching cities or results found</h3>
            <p className="empty-state-desc">Try adjusting your keywords, country selection, or cost index filters.</p>
            <button className="btn btn-primary" onClick={() => updateQueryParams({ q: '', country: 'all', cost: 'all', sort_by: 'popularity' })}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            
            {/* Cities Section */}
            {results.cities.length > 0 && (
              <section className="search-results-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 className="search-results-title" style={{ margin: 0 }}>
                    <MapPin size={22} className="search-results-icon" /> 
                    {type === 'cities' ? 'Explore Cities' : 'Matching Cities'}
                    <span className="search-results-count">{results.cities.length}</span>
                  </h2>
                </div>

                <div className="search-city-grid">
                  {results.cities.map(city => {
                    const costInfo = getCostLevelLabel(city.cost_index);
                    const popScore = city.popularity_score || 0;

                    return (
                      <div key={city.id} className="search-city-card">
                        
                        {/* Image Header with Badges */}
                        <div className="search-city-card-image-wrap">
                          <img 
                            src={city.image_url || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600`} 
                            alt={city.name} 
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600'; }}
                          />
                          <div className="search-city-card-badges">
                            <span className={`badge ${costInfo.color}`} style={{ fontWeight: 700 }}>
                              {costInfo.icon} {costInfo.label}
                            </span>
                            {popScore > 80 && (
                              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                                🔥 Top Pick
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="search-city-card-body">
                          <div className="search-city-card-header">
                            <h3 className="search-city-card-name">{city.name}</h3>
                          </div>
                          <div className="search-city-card-country">
                            <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{city.country || 'Destination'}</span>
                          </div>

                          {/* Metadata Metrics */}
                          <div className="search-city-card-metrics">
                            <div className="search-city-metric-pill" title="Relative cost of living & travel">
                              <span>💰 Cost Index:</span>
                              <strong>{city.cost_index ? Number(city.cost_index).toFixed(1) : '1.0'}x</strong>
                            </div>
                            <div className="search-city-metric-pill" title="Traveler popularity score">
                              <span>⭐ Popularity:</span>
                              <strong>{popScore}/100</strong>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="search-city-card-actions">
                            <button 
                              type="button"
                              className="search-city-add-btn"
                              onClick={() => openAddToTripModal(city)}
                            >
                              <Plus size={16} /> Add to Trip
                            </button>
                            <button 
                              type="button"
                              className="search-city-view-btn"
                              onClick={() => handleStartNewTripWithCity(city)}
                              title="Plan a new trip dedicated to this city"
                            >
                              New Trip
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Activities Section */}
            {results.activities.length > 0 && (
              <section className="search-results-section">
                <h2 className="search-results-title">
                  <Activity size={22} className="search-results-icon" /> Activities
                  <span className="search-results-count">{results.activities.length}</span>
                </h2>
                <div className="search-activity-list">
                  {results.activities.map(activity => (
                    <div key={activity.id} className="search-activity-card">
                      <div className="search-activity-img">
                        <Compass size={32} />
                      </div>
                      <div className="search-activity-body">
                        <div className="search-activity-name">{activity.name}</div>
                        <div className="search-activity-desc">
                          {activity.description}
                        </div>
                        <div className="search-activity-meta">
                          <span className="badge badge-neutral">{activity.category}</span>
                          <span className="badge badge-success">Est. ${activity.cost || activity.estimated_cost || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trips Section */}
            {results.trips.length > 0 && (
              <section className="search-results-section">
                <h2 className="search-results-title">
                  <Compass size={22} className="search-results-icon" /> Public Trips
                  <span className="search-results-count">{results.trips.length}</span>
                </h2>
                <div className="trip-grid">
                  {results.trips.map(trip => (
                    <div key={trip.id} className="trip-card" onClick={() => navigate(`/trips/${trip.id}`)}>
                      <div className="trip-card-img">
                        <img 
                          src={trip.cover_photo_url || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600`} 
                          alt={trip.name} 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; }} 
                        />
                      </div>
                      <div className="trip-card-body">
                        <h3 className="trip-card-title">{trip.name}</h3>
                        <div className="trip-card-meta">
                          By @{trip.user?.username || 'traveler'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>

      {/* Add City to Trip Modal */}
      {selectedCityForTrip && (
        <div className="modal-overlay" onClick={() => setSelectedCityForTrip(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add {selectedCityForTrip.name} to Trip</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  {selectedCityForTrip.country ? `${selectedCityForTrip.name}, ${selectedCityForTrip.country}` : selectedCityForTrip.name}
                </p>
              </div>
              <button className="builder-section-action-btn" onClick={() => setSelectedCityForTrip(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {modalSuccessMsg && (
                <div style={{ padding: '12px 16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} />
                  <span>{modalSuccessMsg}</span>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
                  Select an existing trip:
                </div>

                {loadingTrips ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-lg)' }}></div>)}
                  </div>
                ) : userTrips.length === 0 ? (
                  <div style={{ padding: '20px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                    You don't have any upcoming trips yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {userTrips.map(trip => (
                      <button
                        key={trip.id}
                        type="button"
                        className="add-trip-select-item"
                        onClick={() => handleAddCityToExistingTrip(trip)}
                        disabled={addingToTripId === trip.id}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{trip.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'Dates TBD'}
                          </div>
                        </div>
                        {addingToTripId === trip.id ? (
                          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <Plus size={18} style={{ color: 'var(--color-primary)' }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  style={{ justifyContent: 'center', padding: '12px' }}
                  onClick={() => handleStartNewTripWithCity(selectedCityForTrip)}
                >
                  <Sparkles size={16} /> Plan a Brand New Trip for {selectedCityForTrip.name}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

