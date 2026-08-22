import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchCities, getCitySuggestions, createTrip } from '../api/client';
import { Search, MapPin, Calendar, Compass, AlertCircle, ArrowRight } from 'lucide-react';

export function CreateTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCityId = location.state?.cityId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    city_id: initialCityId || ''
  });

  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState('');

  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If we came with an initial city ID, fetch it to get its name and suggestions
  useEffect(() => {
    if (initialCityId) {
      handleCitySelect({ id: initialCityId, name: 'Selected City' }); // Optimistic name until we have full list
      // We could fetch single city here if we had an endpoint for it to get real name,
      // but we'll just fetch suggestions
    }
  }, [initialCityId]);

  // Debounced city search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch.trim().length >= 2) {
        setIsSearchingCities(true);
        searchCities({ search: citySearch })
          .then(data => {
            // handle pagination or list response depending on backend schema
            // searchCities returns list according to schema
            setCities(Array.isArray(data) ? data : (data.items || []));
            setShowCityDropdown(true);
          })
          .catch(console.error)
          .finally(() => setIsSearchingCities(false));
      } else {
        setCities([]);
        setShowCityDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [citySearch]);

  const handleCitySelect = async (city) => {
    setFormData(prev => ({ ...prev, city_id: city.id }));
    setSelectedCityName(city.name);
    setCitySearch('');
    setShowCityDropdown(false);

    setLoadingSuggestions(true);
    try {
      const suggs = await getCitySuggestions(city.id);
      setSuggestions(suggs);
      // Auto-fill trip name if empty
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: `Trip to ${city.name}` }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.city_id) {
      setError('Please select a destination city');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      const trip = await createTrip(formData);
      navigate(`/trips/${trip.id}/build`);
    } catch (err) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-12)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="page-header text-center">
            <h1 className="page-title">Plan a New Trip</h1>
            <p className="page-subtitle">Where do you want to go?</p>
          </div>

          <div className="card p-0 mb-6" style={{ overflow: 'visible' }}>
            <div className="p-6">
              {error && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* City Picker */}
                <div className="input-group relative">
                  <label className="input-label">Destination City <span className="required">*</span></label>
                  {selectedCityName ? (
                    <div className="flex items-center justify-between p-3 bg-surface border border-primary rounded-sm" style={{ borderColor: 'var(--color-primary)' }}>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin size={18} className="text-primary" />
                        {selectedCityName}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm text-xs"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, city_id: '' }));
                          setSelectedCityName('');
                          setSuggestions(null);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={16} className="absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        className="input" 
                        style={{ paddingLeft: '36px' }}
                        placeholder="Search for a city (e.g., Paris, Tokyo)..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                      />
                      {isSearchingCities && (
                        <div className="absolute spinner spinner-sm" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}></div>
                      )}
                      
                      {showCityDropdown && cities.length > 0 && (
                        <div className="navbar-dropdown w-full mt-1" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10 }}>
                          {cities.map(city => (
                            <button 
                              key={city.id}
                              type="button"
                              className="navbar-dropdown-item py-3"
                              onClick={() => handleCitySelect(city)}
                            >
                              <MapPin size={16} className="text-muted" />
                              <div>
                                <div className="font-medium text-base">{city.name}</div>
                                <div className="text-xs text-muted">{city.country}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid-2 gap-4">
                  <div className="input-group">
                    <label className="input-label" htmlFor="start_date">Start Date <span className="required">*</span></label>
                    <input type="date" id="start_date" name="start_date" className="input" value={formData.start_date} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="end_date">End Date <span className="required">*</span></label>
                    <input type="date" id="end_date" name="end_date" className="input" value={formData.end_date} onChange={handleChange} required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="name">Trip Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" className="input" placeholder="E.g., Summer in Paris" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="description">Description (Optional)</label>
                  <textarea id="description" name="description" className="input" style={{ minHeight: '80px', paddingTop: '10px' }} placeholder="What's the purpose of this trip?" value={formData.description} onChange={handleChange} />
                </div>

                <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="submit" className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} disabled={loading || !formData.city_id}>
                    {loading ? 'Creating...' : 'Create & Build Itinerary'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Suggestions Area */}
          {loadingSuggestions ? (
            <div className="mt-8">
              <h3 className="section-title mb-4">Discovering activities...</h3>
              <div className="grid-2 gap-4">
                <div className="skeleton skeleton-card"></div>
                <div className="skeleton skeleton-card"></div>
              </div>
            </div>
          ) : suggestions ? (
            <div className="mt-10 animate-fade-in">
              <h3 className="section-title mb-2">Suggestions for {selectedCityName}</h3>
              <p className="text-secondary mb-6">Here are some popular activities you can add to your itinerary in the next step.</p>
              
              {suggestions.length > 0 ? (
                <div className="grid-2 gap-4">
                  {suggestions.map(activity => (
                    <div key={activity.id} className="activity-card cursor-default">
                      <div className="activity-card-img">
                        <Compass size={24} />
                      </div>
                      <div className="activity-card-body">
                        <div className="activity-card-name">{activity.name}</div>
                        <div className="text-sm text-secondary line-clamp-2 mb-2">{activity.description}</div>
                        <div className="activity-card-meta">
                          <span className="badge badge-neutral">{activity.category}</span>
                          <span className="font-medium">${activity.estimated_cost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state bg-surface border border-border rounded-md py-8">
                  <Compass className="empty-state-icon" />
                  <div className="empty-state-title text-xl">No suggestions yet</div>
                  <div className="empty-state-desc">We're still gathering the best activities for this destination.</div>
                </div>
              )}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
