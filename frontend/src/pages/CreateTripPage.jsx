import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchCities, createTrip, createSection } from '../api/client';
import { MapPin, Calendar, Compass, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';

export function CreateTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    city_id: location.state?.cityId || '',
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [selectedCityObj, setSelectedCityObj] = useState(null);

  // Search Cities Debounced
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (cityQuery.trim().length > 1) {
        setIsSearchingCity(true);
        try {
          const res = await searchCities({ search: cityQuery, limit: 6 });
          const items = Array.isArray(res) ? res : res.items || [];
          setCityResults(items);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearchingCity(false);
        }
      } else {
        setCityResults([]);
        setShowDropdown(false);
      }
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [cityQuery]);

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setFormData(prev => ({ 
      ...prev, 
      city_id: city.id,
      name: prev.name || `Trip to ${city.name}`
    }));
    setCityQuery('');
    setShowDropdown(false);
    setError('');
  };

  const handlePopularCityClick = async (cityName) => {
    setIsSearchingCity(true);
    try {
      const res = await searchCities({ search: cityName, limit: 1 });
      const items = Array.isArray(res) ? res : res.items || [];
      if (items.length > 0) {
        handleCitySelect(items[0]);
      } else {
        setCityQuery(cityName);
      }
    } catch (err) {
      setCityQuery(cityName);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !formData.city_id && !selectedCityObj) {
      setError('Please select a destination to continue.');
      return;
    }
    if (step === 2) {
      if (!formData.start_date || !formData.end_date) {
        setError('Please select both start and end dates.');
        return;
      }
      if (formData.end_date < formData.start_date) {
        setError('End date cannot be earlier than start date.');
        return;
      }
      // Auto fill trip name if empty
      if (!formData.name && selectedCityObj?.name) {
        setFormData(prev => ({ ...prev, name: `Trip to ${selectedCityObj.name}` }));
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Please give your trip a name.');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Please provide valid start and end dates.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const tripPayload = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description?.trim() || ""
      };

      const trip = await createTrip(tripPayload);

      // Create initial itinerary section for selected destination
      if (formData.city_id) {
        try {
          await createSection(trip.id, {
            city_id: formData.city_id,
            title: `${selectedCityObj?.name || 'Main'} Leg`,
            start_date: formData.start_date,
            end_date: formData.end_date,
            description: "",
            budget: 0
          });
        } catch (secErr) {
          console.warn("Could not create initial section:", secErr);
        }
      }

      // Always navigate to builder on successful trip creation
      navigate(`/trips/${trip.id}/build`);
    } catch (err) {
      console.error("Failed to create trip", err);
      setError(err.message || 'Failed to create trip. Please check your dates and details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-trip-page">
      <div className="create-trip-inner">
        
        {/* Stepper Header */}
        <div className="stepper">
          <div className="stepper-dots">
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`stepper-dot ${step === s ? 'active' : step > s ? 'done' : 'future'}`}
              />
            ))}
            <span className="stepper-label">
              {step === 1 ? 'Phase 1: Destination' : step === 2 ? 'Phase 2: Dates' : 'Phase 3: Details'}
            </span>
          </div>
          <div className="stepper-counter">Phase {step} of 3</div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '20px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Phase 1: Destination */}
        {step === 1 && (
          <div className="step-content">
            <h1 className="step-title">Where are you going?</h1>
            <p className="step-subtitle">Search for a city, country, or popular destination to start your journey.</p>
            
            {!selectedCityObj ? (
              <div className="city-search">
                <div className="city-search-input-wrap">
                  <MapPin className="city-search-icon" size={22} />
                  <input 
                    type="text" 
                    className="city-search-input"
                    placeholder="Search destination (e.g. Paris, Tokyo, Delhi, Rome)..." 
                    value={cityQuery}
                    onChange={e => setCityQuery(e.target.value)}
                    autoFocus
                  />
                  {isSearchingCity && <Loader2 className="city-search-spinner" size={20} />}
                </div>
                
                {showDropdown && cityResults.length > 0 && (
                  <div className="city-dropdown">
                    {cityResults.map(city => (
                      <button key={city.id} className="city-dropdown-item" onClick={() => handleCitySelect(city)}>
                        <div className="city-dropdown-icon">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <div className="city-dropdown-name">{city.name}</div>
                          <div className="city-dropdown-country">{city.country || 'Destination'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="suggestions">
                  <div className="suggestions-label"><Compass size={16}/> Popular Destinations</div>
                  <div className="suggestions-list">
                    {['Tokyo', 'Paris', 'New York', 'London', 'Rome', 'Delhi'].map(city => (
                      <button key={city} className="suggestion-tag" onClick={() => handlePopularCityClick(city)}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="selected-city">
                <div className="selected-city-name">
                  <MapPin size={28} />
                  <span>{selectedCityObj.name}{selectedCityObj.country ? `, ${selectedCityObj.country}` : ''}</span>
                </div>
                <button className="selected-city-remove" onClick={() => { setSelectedCityObj(null); setFormData(prev => ({ ...prev, city_id: '' })); }}>
                  Change Destination
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Dates */}
        {step === 2 && (
          <div className="step-content">
            <h1 className="step-title">When are you going?</h1>
            <p className="step-subtitle">Select your arrival and departure dates for {selectedCityObj?.name || 'this trip'}.</p>
            
            <div className="dates-grid">
              <div className="date-field">
                <label>Start Date</label>
                <div className="date-input-wrap">
                  <Calendar size={20} />
                  <input 
                    type="date" 
                    className="date-input"
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      start_date: e.target.value,
                      end_date: prev.end_date && prev.end_date < e.target.value ? e.target.value : prev.end_date
                    }))}
                  />
                </div>
              </div>
              <div className="date-field">
                <label>End Date</label>
                <div className="date-input-wrap">
                  <Calendar size={20} />
                  <input 
                    type="date" 
                    className="date-input"
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date}
                  />
                </div>
              </div>
            </div>
            
            {formData.start_date && formData.end_date && (
              <div className="date-summary animate-fade-in">
                <Calendar size={22} />
                <span>
                  Your trip spans {Math.max(1, Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24)) + 1)} days ({new Date(formData.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(formData.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase 3: Details */}
        {step === 3 && (
          <div className="step-content">
            <h1 className="step-title">Give your trip a name</h1>
            <p className="step-subtitle">Add a title and some optional notes for your upcoming adventure.</p>
            
            <div className="details-form">
              <div>
                <label className="input-label">Trip Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="details-input"
                  placeholder={`e.g. Summer in ${selectedCityObj?.name || 'Paradise'}`}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Trip Description & Notes (Optional)</label>
                <textarea 
                  className="details-textarea"
                  placeholder="What are you most excited about? Who is coming with you?"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="create-trip-footer">
          <button 
            className={`create-trip-back ${step === 1 ? 'hidden' : ''}`}
            onClick={handleBack}
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          {step < 3 ? (
            <button 
              className="create-trip-next"
              onClick={handleNext}
              disabled={(step === 1 && !selectedCityObj && !formData.city_id) || (step === 2 && (!formData.start_date || !formData.end_date))}
            >
              <span>{step === 1 ? 'Continue to Dates' : 'Continue to Details'}</span> 
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className="create-trip-next"
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> 
                  <span>Creating Trip...</span>
                </>
              ) : (
                <>
                  <span>Create Itinerary</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
