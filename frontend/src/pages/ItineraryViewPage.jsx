import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getItinerary, getBudget } from '../api/client';
import { MapPin, Calendar, Clock, DollarSign, AlignLeft, ArrowLeft, Edit2, AlertTriangle, CheckCircle, PieChart } from 'lucide-react';

export function ItineraryViewPage() {
  const { tripId } = useParams();
  
  const [itinerary, setItinerary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [filterDay, setFilterDay] = useState('all');

  useEffect(() => {
    Promise.all([
      getItinerary(tripId),
      getBudget(tripId)
    ])
    .then(([itineraryData, budgetData]) => {
      setItinerary(itineraryData);
      setBudget(budgetData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="itinerary-page">
        <div className="container">
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-2xl)', marginBottom: '40px' }}></div>
          <div className="itinerary-layout">
            <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }}></div>
            <div className="skeleton" style={{ height: '600px', borderRadius: 'var(--radius-xl)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="itinerary-page flex items-center justify-center">
        <div className="empty-state" style={{ maxWidth: '400px', margin: 'auto' }}>
          <AlertTriangle size={64} className="empty-state-icon" style={{ color: 'var(--color-warning)' }} />
          <h3 className="empty-state-title">Failed to load itinerary</h3>
          <p className="empty-state-desc">We couldn't retrieve the details for this trip.</p>
          <Link to="/trips" className="btn btn-primary btn-lg">
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  // Generate all unique days from start_date to end_date or activity dates
  const generateTripDays = () => {
    if (!itinerary.start_date || !itinerary.end_date) return [];
    const days = new Set();
    
    // Add all dates between start and end
    try {
      const cur = new Date(itinerary.start_date);
      const end = new Date(itinerary.end_date);
      while (cur <= end) {
        days.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } catch (e) {
      console.warn("Date range calc error:", e);
    }

    // Also add any activity dates
    (itinerary.sections || []).forEach(sec => {
      (sec.activities || []).forEach(act => {
        if (act.scheduled_date) {
          days.add(act.scheduled_date.split('T')[0]);
        }
      });
    });

    return Array.from(days).sort();
  };

  const allDays = generateTripDays();


  return (
    <div className="itinerary-page">
      <div className="container">
        
        {/* Banner */}
        <div className="itinerary-header group">
          <img 
            src={itinerary.cover_photo_url || `https://source.unsplash.com/1200x400/?travel,${encodeURIComponent(itinerary.name)}`} 
            alt={itinerary.name} 
            className="itinerary-header-img"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200'; }}
          />
          <div className="itinerary-header-overlay"></div>
          <div className="itinerary-header-content">
            <Link to="/trips" className="btn btn-ghost" style={{ color: 'white', padding: 0, marginBottom: '16px' }}>
              <ArrowLeft size={18} /> Back to My Trips
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 className="itinerary-header-title">{itinerary.name}</h1>
                <div className="itinerary-header-meta">
                  <div className="itinerary-header-meta-item">
                    <Calendar size={18} /> 
                    {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--color-text)', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                  <DollarSign size={18} /> Budget Breakdown
                </Link>
                <Link to={`/trips/${tripId}/build`} className="btn btn-primary" style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <Edit2 size={18} /> Edit Itinerary
                </Link>
              </div>
            </div>
          </div>
        </div>


        <div className="itinerary-layout">
          
          {/* Left Column: Itinerary Timeline */}
          <div>
            
            {/* Filter Bar */}
            <div className="itinerary-filter-bar">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-3)', paddingLeft: '8px' }}>Filter:</span>
              <button 
                className={`itinerary-filter-btn ${filterDay === 'all' ? 'active' : ''}`}
                onClick={() => setFilterDay('all')}
              >
                All Days
              </button>
              {allDays.map((day, idx) => (
                <button 
                  key={day}
                  className={`itinerary-filter-btn ${filterDay === day ? 'active' : ''}`}
                  onClick={() => setFilterDay(day)}
                >
                  Day {idx + 1} <span style={{ opacity: 0.7, marginLeft: '4px' }}>({new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>
                </button>
              ))}
            </div>

            {(!itinerary.sections || itinerary.sections.length === 0) ? (
              <div className="empty-state" style={{ border: '1px dashed var(--color-border)', background: 'var(--color-surface)' }}>
                <MapPin size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">Your itinerary is empty</h3>
                <p className="empty-state-desc">Head to the builder to add sections and activities.</p>
                <Link to={`/trips/${tripId}/build`} className="btn btn-primary">
                  Open Builder
                </Link>
              </div>
            ) : (
              <div className="itinerary-timeline">
                {itinerary.sections.map((section, sIdx) => {
                  
                  const visibleActivities = (section.activities || []).filter(act => 
                    filterDay === 'all' || (act.scheduled_date && act.scheduled_date.startsWith(filterDay))
                  ).sort((a, b) => {
                    const timeA = a.scheduled_time || '24:00';
                    const timeB = b.scheduled_time || '24:00';
                    const dateA = a.scheduled_date || '9999-12-31';
                    const dateB = b.scheduled_date || '9999-12-31';
                    if (dateA !== dateB) return dateA.localeCompare(dateB);
                    return timeA.localeCompare(timeB);
                  });

                  if (filterDay !== 'all' && visibleActivities.length === 0) return null;

                  return (
                    <div key={section.id} className="itinerary-day">
                      <div className="itinerary-day-header">
                        <h2 className="itinerary-day-title">{section.title}</h2>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <span className="badge badge-neutral">
                            {new Date(section.start_date).toLocaleDateString()} - {new Date(section.end_date).toLocaleDateString()}
                          </span>
                          {section.budget > 0 && (
                            <span className="badge badge-success">
                              <DollarSign size={14} /> Budget: ${section.budget}
                            </span>
                          )}
                        </div>
                        {section.description && <p style={{ marginTop: '12px', color: 'var(--color-text-2)' }}>{section.description}</p>}
                      </div>

                      <div className="itinerary-events">
                        {visibleActivities.length === 0 ? (
                          <div style={{ padding: '16px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No activities planned for this section yet.
                          </div>
                        ) : (
                          visibleActivities.map((act) => (
                            <div key={act.id} className="itinerary-event">
                              <div className="itinerary-event-time">
                                {act.scheduled_time ? act.scheduled_time.substring(0, 5) : 'TBD'}
                              </div>
                              <div className="itinerary-event-dot"></div>
                              <div className="itinerary-event-card">
                                <div className="itinerary-event-details">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 className="itinerary-event-title">{act.activity_name || 'Activity'}</h4>
                                    {act.cost !== null && act.cost !== undefined && (
                                      <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '1rem' }}>
                                        ${act.cost}
                                      </span>
                                    )}
                                  </div>
                                  <div className="itinerary-event-meta">
                                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{act.activity_category || 'General'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Calendar size={14} /> {act.scheduled_date ? new Date(act.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unscheduled'}
                                    </span>
                                  </div>
                                  
                                  {act.notes && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-text-2)', display: 'flex', gap: '8px' }}>
                                      <AlignLeft size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                      {act.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Budget Sidebar */}
          <div>
            {budget ? (
              <div className="itinerary-budget">
                <h3 className="itinerary-budget-header">
                  <PieChart size={24} style={{ color: 'var(--color-primary)' }} />
                  Budget Overview
                </h3>
                
                <div className="itinerary-budget-total">
                  <div className="itinerary-budget-label">Total Estimated Cost</div>
                  <div className="itinerary-budget-amount">${budget.total?.toFixed(2) || '0.00'}</div>
                  
                  {(() => {
                    const totalBudgetAllocated = (itinerary.sections || []).reduce((sum, s) => sum + (s.budget || 0), 0);
                    if (totalBudgetAllocated === 0) return null;
                    
                    const pct = (budget.total / totalBudgetAllocated) * 100;
                    let healthColor = "var(--color-success)";
                    let healthBg = "var(--color-success-bg)";
                    
                    if (pct > 100) {
                      healthColor = "var(--color-danger)";
                      healthBg = "var(--color-danger-bg)";
                    } else if (pct > 85) {
                      healthColor = "var(--color-warning)";
                      healthBg = "var(--color-warning-bg)";
                    }

                    return (
                      <div style={{ marginTop: '16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--color-text-2)' }}>
                          <span>Allocated: ${totalBudgetAllocated}</span>
                          <span>{Math.round(pct)}% used</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--color-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: healthColor, transition: 'width 1s' }}></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {(budget.by_category || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', marginBottom: '12px' }}>By Category</div>
                    <div className="itinerary-budget-list">
                      {[...(budget.by_category || [])].sort((a, b) => b.total - a.total).map((item) => (
                        <div key={item.category} className="itinerary-budget-item">
                          <span className="itinerary-budget-item-name" style={{ textTransform: 'capitalize' }}>{item.category}</span>
                          <span className="itinerary-budget-item-cost">${(item.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {budget.average_daily > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Avg Daily Cost</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>${budget.average_daily.toFixed(0)} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-3)' }}>/ day</span></div>
                  </div>
                )}

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <Link to={`/trips/${tripId}/budget`} className="btn btn-secondary w-full" style={{ justifyContent: 'center', padding: '10px 14px' }}>
                    <DollarSign size={16} /> Detailed Cost Breakdown
                  </Link>
                </div>
              </div>
            ) : (

              <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }}></div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}
