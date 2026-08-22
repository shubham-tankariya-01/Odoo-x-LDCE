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
      <div className="page-wrapper container" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="skeleton skeleton-text h-12 w-64 mb-8"></div>
        <div className="grid grid-3 gap-8" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="skeleton skeleton-card h-96"></div>
          <div className="skeleton skeleton-card h-64"></div>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="page-wrapper container flex items-center justify-center">
        <div className="empty-state">
          <h3 className="empty-state-title">Failed to load itinerary</h3>
          <Link to="/trips" className="btn btn-primary mt-4">Back to Trips</Link>
        </div>
      </div>
    );
  }

  // Extract unique days from itinerary for filtering
  const allDays = Array.from(new Set(
    (itinerary.sections || []).flatMap(sec => 
      (sec.activities || []).map(act => act.scheduled_date.split('T')[0])
    )
  )).sort();

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="mb-6">
          <Link to="/trips" className="btn btn-ghost btn-sm text-secondary mb-4" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Back to My Trips
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="page-title mb-1">{itinerary.name}</h1>
              <div className="flex items-center gap-4 text-secondary text-sm">
                <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}</span>
                <span className={`badge badge-${itinerary.status}`}>{itinerary.status}</span>
              </div>
            </div>
            <Link to={`/trips/${tripId}/build`} className="btn btn-secondary">
              <Edit2 size={16} /> Edit Itinerary
            </Link>
          </div>
        </div>

        <div className="grid grid-3 gap-8" style={{ gridTemplateColumns: '1fr', '@media (min-width: 1024px)': { gridTemplateColumns: '2fr 1fr' } }}>
          
          {/* Left Column: Itinerary Details */}
          <div className="flex flex-col gap-6">
            
            {/* Filter Bar */}
            <div className="search-filter-bar mb-0" style={{ padding: 'var(--space-2) var(--space-4)' }}>
              <div className="text-sm font-medium text-secondary mr-2">Filter by Day:</div>
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button 
                  className={`btn btn-sm rounded-full ${filterDay === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterDay('all')}
                >
                  All Days
                </button>
                {allDays.map((day, idx) => (
                  <button 
                    key={day}
                    className={`btn btn-sm rounded-full ${filterDay === day ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterDay(day)}
                  >
                    Day {idx + 1} ({new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                  </button>
                ))}
              </div>
            </div>

            {(!itinerary.sections || itinerary.sections.length === 0) ? (
              <div className="empty-state bg-surface border border-border rounded-md">
                <MapPin className="empty-state-icon" />
                <h3 className="empty-state-title">Your itinerary is empty</h3>
                <p className="empty-state-desc">Head to the builder to add sections and activities.</p>
                <Link to={`/trips/${tripId}/build`} className="btn btn-primary mt-4">Open Builder</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {itinerary.sections.map((section, sIdx) => {
                  
                  // Filter activities in this section by selected day
                  const visibleActivities = (section.activities || []).filter(act => 
                    filterDay === 'all' || act.scheduled_date.startsWith(filterDay)
                  ).sort((a, b) => {
                    const timeA = a.scheduled_time || '24:00';
                    const timeB = b.scheduled_time || '24:00';
                    if (a.scheduled_date !== b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date);
                    return timeA.localeCompare(timeB);
                  });

                  if (filterDay !== 'all' && visibleActivities.length === 0) return null;

                  return (
                    <div key={section.id} className="relative">
                      {/* Timeline line connecting sections */}
                      {sIdx !== itinerary.sections.length - 1 && (
                        <div className="absolute top-10 bottom-0 left-[23px] w-0.5 bg-border z-0 -mb-10"></div>
                      )}
                      
                      <div className="flex items-start gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-surface border-2 border-primary text-primary flex items-center justify-center shrink-0 font-display font-bold text-lg shadow-sm">
                          {sIdx + 1}
                        </div>
                        <div className="pt-2 flex-1">
                          <h2 className="text-2xl font-display font-semibold text-text mb-1">{section.title}</h2>
                          {section.description && <p className="text-secondary text-sm mb-2">{section.description}</p>}
                          
                          <div className="flex items-center gap-4 text-xs text-muted font-medium bg-surface-2 inline-flex px-3 py-1.5 rounded-md">
                            <span>{new Date(section.start_date).toLocaleDateString()} - {new Date(section.end_date).toLocaleDateString()}</span>
                            {section.budget > 0 && <span>• Budget: ${section.budget}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="pl-[72px]">
                        {visibleActivities.length === 0 ? (
                          <div className="text-sm text-muted italic">No activities planned for this section yet.</div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {visibleActivities.map((act) => (
                              <div key={act.id} className="card p-4 flex gap-4 hover:-translate-y-0.5 transition-transform group">
                                <div className="text-primary font-bold text-sm w-12 pt-0.5 shrink-0">
                                  {act.scheduled_time ? act.scheduled_time.substring(0, 5) : 'TBD'}
                                </div>
                                <div className="w-1 bg-border rounded-full group-hover:bg-primary-muted transition-colors shrink-0"></div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-4 mb-1">
                                    <h4 className="font-semibold text-text text-base">{act.activity?.name || 'Activity'}</h4>
                                    {act.cost_override !== null && (
                                      <span className="font-medium text-sm whitespace-nowrap">${act.cost_override}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mb-2">
                                    <span className="badge badge-neutral">{act.activity?.category || 'General'}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(act.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  
                                  {act.notes && (
                                    <div className="text-sm text-secondary bg-surface-2 p-2.5 rounded-sm flex items-start gap-2 mt-3">
                                      <AlignLeft size={14} className="mt-0.5 shrink-0 opacity-70" />
                                      <p>{act.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Budget Breakdown */}
          <div className="lg:max-w-md w-full">
            {budget ? (
              <div className="budget-card sticky top-24">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <h3 className="text-xl font-display font-semibold flex items-center gap-2"><PieChart size={20} className="text-primary" /> Budget Overview</h3>
                </div>
                
                <div className="mb-8">
                  <div className="text-sm text-secondary mb-1 font-medium text-uppercase tracking-wide">Total Estimated Cost</div>
                  <div className="budget-total">${budget.total?.toFixed(2) || '0.00'}</div>
                  
                  {/* Budget Health indicator (compare to sections total budget) */}
                  {(() => {
                    const totalBudgetAllocated = (itinerary.sections || []).reduce((sum, s) => sum + (s.budget || 0), 0);
                    if (totalBudgetAllocated === 0) return null;
                    
                    const pct = (budget.total / totalBudgetAllocated) * 100;
                    let healthClass = "badge-success";
                    let icon = <CheckCircle size={14} />;
                    let msg = "Under Budget";
                    
                    if (pct > 100) {
                      healthClass = "badge-danger";
                      icon = <AlertTriangle size={14} />;
                      msg = "Over Budget";
                    } else if (pct > 85) {
                      healthClass = "badge-warning";
                      icon = <AlertTriangle size={14} />;
                      msg = "Approaching Limit";
                    }

                    return (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-secondary">Allocated: ${totalBudgetAllocated}</span>
                          <span className="font-medium text-secondary">{Math.round(pct)}% used</span>
                        </div>
                        <div className="budget-bar mb-3 bg-surface-2">
                          <div className={`budget-bar-fill ${pct > 100 ? 'bg-danger' : pct > 85 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                        <div className={`badge ${healthClass} w-full justify-center py-1.5`}>
                          {icon} {msg}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {Object.keys(budget.by_category || {}).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-3 pb-2 border-b border-border">By Category</div>
                    <div className="flex flex-col gap-3">
                      {Object.entries(budget.by_category).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-muted"></span>
                            <span className="capitalize text-secondary">{category}</span>
                          </span>
                          <span className="font-medium text-text">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {budget.average_daily > 0 && (
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm font-semibold text-secondary">Average Daily Cost</div>
                    <div className="font-medium text-text">${budget.average_daily.toFixed(2)} / day</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="skeleton skeleton-card h-96 sticky top-24"></div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}
