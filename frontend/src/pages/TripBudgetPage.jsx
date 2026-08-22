import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBudget, getItinerary } from '../api/client';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  PieChart, 
  Printer, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import '../styles/pages/trip-budget.css';

const CATEGORY_COLORS = {
  dining: '#f97316',      // orange
  meal: '#f97316',
  sightseeing: '#3b82f6', // blue
  attraction: '#3b82f6',
  transport: '#8b5cf6',   // purple
  stay: '#10b981',        // emerald
  lodging: '#10b981',
  activity: '#ec4899',    // pink
  shopping: '#eab308',    // yellow
  other: '#6b7280'        // gray
};

const CATEGORY_ICONS = {
  dining: '🍽️',
  meal: '🍽️',
  sightseeing: '🏛️',
  attraction: '🏛️',
  transport: '🚗',
  stay: '🏨',
  lodging: '🏨',
  activity: '🎯',
  shopping: '🛍️',
  other: '🏷️'
};

export function TripBudgetPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState('');
  
  // Ledger search & filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategory, setLedgerCategory] = useState('all');

  useEffect(() => {
    fetchTripAndBudget();
  }, [tripId]);

  const fetchTripAndBudget = async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetRes, itinRes] = await Promise.all([
        getBudget(tripId).catch(err => {
          console.warn("Budget endpoint error, fallback to itinerary", err);
          return null;
        }),
        getItinerary(tripId)
      ]);

      setItinerary(itinRes);
      
      if (budgetRes) {
        setBudgetData(budgetRes);
      } else if (itinRes) {
        // Compute client-side fallback if budget service had edge cases
        let total = 0;
        let allocated = 0;
        const catMap = {};
        const dayMap = {};
        const secList = [];

        (itinRes.sections || []).forEach(sec => {
          const sBudget = parseFloat(sec.budget) || 0;
          allocated += sBudget;
          let secSpent = 0;

          (sec.activities || []).forEach(act => {
            const cost = act.cost !== null && act.cost !== undefined ? parseFloat(act.cost) : 0;
            total += cost;
            secSpent += cost;
            const cat = (act.activity_category || 'other').toLowerCase();
            catMap[cat] = (catMap[cat] || 0) + cost;

            if (act.scheduled_date) {
              const dStr = act.scheduled_date.split('T')[0];
              dayMap[dStr] = (dayMap[dStr] || 0) + cost;
            }
          });

          secList.push({
            section_id: sec.id,
            title: sec.title || (sec.city_name ? `${sec.city_name} Leg` : 'Leg'),
            city_name: sec.city_name,
            budget: sBudget,
            total_spent: secSpent,
            activities_count: (sec.activities || []).length
          });
        });

        const byCategory = Object.entries(catMap).map(([k, v]) => ({ category: k, total: v }));
        byCategory.sort((a, b) => b.total - a.total);

        const byDay = Object.entries(dayMap).map(([k, v]) => ({ date: k, total: v }));
        byDay.sort((a, b) => a.date.localeCompare(b.date));

        let days = 1;
        if (itinRes.start_date && itinRes.end_date) {
          const diff = (new Date(itinRes.end_date) - new Date(itinRes.start_date)) / (1000 * 60 * 60 * 24) + 1;
          days = Math.max(diff, 1);
        }

        setBudgetData({
          trip_id: tripId,
          total,
          allocated_budget: allocated,
          by_category: byCategory,
          by_day: byDay,
          by_section: secList,
          average_daily: total / days
        });
      }
    } catch (err) {
      console.error("Failed to load budget", err);
      setError("Unable to load budget information for this trip.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="budget-page">
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div className="skeleton" style={{ height: '60px', marginBottom: '24px', borderRadius: 'var(--radius-lg)' }}></div>
          <div className="budget-metrics-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-xl)' }}></div>)}
          </div>
          <div className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-xl)' }}></div>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="budget-page">
        <div className="container" style={{ maxWidth: '720px', textAlign: 'center', paddingTop: '60px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{error || 'Trip Not Found'}</h2>
          <button className="btn btn-primary" onClick={() => navigate('/trips')}>
            Back to Trips
          </button>
        </div>
      </div>
    );
  }

  // Calculate high-level financial metrics
  const totalSpent = budgetData?.total || 0;
  const allocatedBudget = budgetData?.allocated_budget || 0;
  const remainingBudget = allocatedBudget - totalSpent;
  const percentUsed = allocatedBudget > 0 ? (totalSpent / allocatedBudget) * 100 : 0;
  const avgDaily = budgetData?.average_daily || 0;

  // Flatten all activities across sections for the itemized ledger
  const allScheduledActivities = [];
  (itinerary.sections || []).forEach(sec => {
    (sec.activities || []).forEach(act => {
      allScheduledActivities.push({
        ...act,
        sectionTitle: sec.title || (sec.city_name ? `${sec.city_name} Leg` : 'Leg'),
        sectionCity: sec.city_name,
        sectionId: sec.id
      });
    });
  });

  // Filter ledger
  const filteredLedger = allScheduledActivities.filter(item => {
    const matchesSearch = !ledgerSearch || 
      item.activity_name?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.sectionTitle?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.notes?.toLowerCase().includes(ledgerSearch.toLowerCase());
    
    const itemCat = (item.activity_category || 'other').toLowerCase();
    const matchesCategory = ledgerCategory === 'all' || itemCat === ledgerCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort chronological
  filteredLedger.sort((a, b) => {
    const dateA = a.scheduled_date || '9999-99-99';
    const dateB = b.scheduled_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="budget-page">
      <div className="container" style={{ maxWidth: '1120px' }}>
        
        {/* Header */}
        <div className="budget-header">
          <div className="budget-header-left">
            <button onClick={() => navigate(`/trips/${tripId}`)} className="budget-back-btn">
              <ArrowLeft size={16} /> Back to Itinerary Overview
            </button>
            <h1 className="budget-title">{itinerary.name} — Cost & Budget Breakdown</h1>
            <div className="budget-subtitle">
              {itinerary.start_date && itinerary.end_date && (
                <span>
                  <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  {new Date(itinerary.start_date).toLocaleDateString()} – {new Date(itinerary.end_date).toLocaleDateString()}
                </span>
              )}
              <span>•</span>
              <span>
                <Layers size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {(itinerary.sections || []).length} Legs / Sections
              </span>
              <span>•</span>
              <span>
                {allScheduledActivities.length} Scheduled Activities
              </span>
            </div>
          </div>

          <div className="budget-header-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => window.print()}
              title="Print or export budget report"
            >
              <Printer size={16} /> Print Report
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate(`/trips/${tripId}/build`)}
            >
              <Edit3 size={16} /> Edit Itinerary & Budget
            </button>
          </div>
        </div>

        {/* ── 4 Top Hero Metric Cards ── */}
        <div className="budget-metrics-grid">
          
          {/* Card 1: Total Estimated Spent */}
          <div className="budget-metric-card">
            <div className="budget-metric-header">
              <span>Total Estimated Spent</span>
              <div className="budget-metric-icon">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="budget-metric-value">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="budget-metric-status neutral">
              From {allScheduledActivities.length} scheduled items
            </div>
          </div>

          {/* Card 2: Total Allocated Budget */}
          <div className="budget-metric-card">
            <div className="budget-metric-header">
              <span>Allocated Planned Budget</span>
              <div className="budget-metric-icon">
                <PieChart size={20} />
              </div>
            </div>
            <div className="budget-metric-value">
              {allocatedBudget > 0 ? `$${allocatedBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not Set'}
            </div>
            <div className="budget-metric-status neutral">
              Sum of all section leg targets
            </div>
          </div>

          {/* Card 3: Remaining Balance / Health */}
          <div className="budget-metric-card">
            <div className="budget-metric-header">
              <span>Remaining Balance</span>
              <div className="budget-metric-icon">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className={`budget-metric-value ${remainingBudget < 0 ? 'text-danger' : 'text-success'}`} style={{ color: remainingBudget < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {allocatedBudget > 0 ? (
                `${remainingBudget >= 0 ? '+' : '-'}$${Math.abs(remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                '—'
              )}
            </div>
            <div className={`budget-metric-status ${remainingBudget < 0 ? 'negative' : 'positive'}`}>
              {allocatedBudget > 0 ? (
                remainingBudget >= 0 ? (
                  <><CheckCircle2 size={14} /> Under budget by ${(remainingBudget).toFixed(0)}</>
                ) : (
                  <><AlertTriangle size={14} /> Over budget by ${Math.abs(remainingBudget).toFixed(0)}</>
                )
              ) : (
                'Set section budgets to track balance'
              )}
            </div>
          </div>

          {/* Card 4: Daily Average */}
          <div className="budget-metric-card">
            <div className="budget-metric-header">
              <span>Average Daily Spend</span>
              <div className="budget-metric-icon">
                <Calendar size={20} />
              </div>
            </div>
            <div className="budget-metric-value">${avgDaily.toFixed(2)}</div>
            <div className="budget-metric-status neutral">
              Estimated per day
            </div>
          </div>

        </div>

        {/* ── Budget Utilization Banner ── */}
        {allocatedBudget > 0 && (
          <div className="budget-progress-card">
            <div className="budget-progress-header">
              <span>Budget Health & Utilization</span>
              <span style={{ fontWeight: 700, color: percentUsed > 100 ? 'var(--color-danger)' : percentUsed > 80 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {percentUsed.toFixed(1)}% Allocated
              </span>
            </div>
            <div className="budget-progress-bar-bg">
              <div 
                className="budget-progress-bar-fill"
                style={{ 
                  width: `${Math.min(percentUsed, 100)}%`,
                  background: percentUsed > 100 ? 'var(--color-danger)' : percentUsed > 80 ? '#fb923c' : 'var(--color-success)'
                }}
              />
            </div>
            <div className="budget-progress-footer">
              <span>$0.00</span>
              <span>
                {percentUsed > 100 ? (
                  <strong style={{ color: 'var(--color-danger)' }}>Warning: Trip expenses exceed planned budget by ${Math.abs(remainingBudget).toFixed(2)}</strong>
                ) : (
                  <span>${remainingBudget.toFixed(2)} remaining cushion</span>
                )}
              </span>
              <span>Target: ${allocatedBudget.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── 2-Column Section: Category Breakdown & Section Legs ── */}
        <div className="budget-grid-2">
          
          {/* Column A: Spending by Category */}
          <div className="budget-card-section">
            <div className="budget-section-title">
              <span>Category Breakdown</span>
              <span className="badge badge-neutral">{(budgetData?.by_category || []).length} Categories</span>
            </div>

            {(budgetData?.by_category || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                No categorized activities added yet.
              </div>
            ) : (
              <div className="budget-category-list">
                {(budgetData?.by_category || []).map(catItem => {
                  const catKey = (catItem.category || 'other').toLowerCase();
                  const share = totalSpent > 0 ? (catItem.total / totalSpent) * 100 : 0;
                  const color = CATEGORY_COLORS[catKey] || '#6b7280';
                  const icon = CATEGORY_ICONS[catKey] || '🏷️';

                  return (
                    <div key={catKey} className="budget-category-item">
                      <div className="budget-category-item-top">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                          <span>{icon}</span> {catKey}
                        </span>
                        <span>
                          ${catItem.total.toFixed(2)} <span style={{ color: 'var(--color-text-3)', fontSize: '0.75rem', fontWeight: 500 }}>({share.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="budget-category-bar-bg">
                        <div 
                          className="budget-category-bar-fill" 
                          style={{ width: `${share}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column B: Leg-by-Leg / Section Budgets */}
          <div className="budget-card-section">
            <div className="budget-section-title">
              <span>Section / Leg Allocation</span>
              <span className="badge badge-neutral">{(budgetData?.by_section || []).length} Legs</span>
            </div>

            {(budgetData?.by_section || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                No sections found in this trip.
              </div>
            ) : (
              <div className="budget-leg-list">
                {(budgetData?.by_section || []).map(sec => {
                  const hasBudget = sec.budget > 0;
                  const isOver = hasBudget && sec.total_spent > sec.budget;
                  const diff = sec.budget - sec.total_spent;

                  return (
                    <div key={sec.section_id} className="budget-leg-item">
                      <div className="budget-leg-info">
                        <div className="budget-leg-title">{sec.title}</div>
                        <div className="budget-leg-meta">
                          {sec.city_name && <span>📍 {sec.city_name} • </span>}
                          <span>{sec.activities_count} activities</span>
                        </div>
                      </div>

                      <div className="budget-leg-amounts">
                        <div className="budget-leg-spent">${sec.total_spent.toFixed(2)}</div>
                        <div className="budget-leg-budget-tag">
                          {hasBudget ? (
                            isOver ? (
                              <span style={{ color: 'var(--color-danger)' }}>Over by ${Math.abs(diff).toFixed(0)} (Target ${sec.budget})</span>
                            ) : (
                              <span style={{ color: 'var(--color-success)' }}>${diff.toFixed(0)} left of ${sec.budget}</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--color-text-3)' }}>Budget not set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Itemized Activity Expense Ledger ── */}
        <div className="budget-ledger-card">
          <div className="budget-ledger-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1875rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Itemized Activity & Expense Ledger
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>
                Detailed chronological view of all costs planned for this trip.
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text"
                  className="input"
                  style={{ height: '36px', paddingLeft: '32px', fontSize: '0.8125rem' }}
                  placeholder="Filter expenses..."
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                />
              </div>

              <select 
                className="search-filter-select"
                style={{ height: '36px', padding: '0 28px 0 12px', fontSize: '0.8125rem' }}
                value={ledgerCategory}
                onChange={e => setLedgerCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="dining">Dining & Meals</option>
                <option value="sightseeing">Sightseeing</option>
                <option value="transport">Transport</option>
                <option value="stay">Lodging / Stay</option>
                <option value="activity">Activities</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="budget-table-wrap">
            {filteredLedger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-3)' }}>
                No scheduled activities match your filter.
              </div>
            ) : (
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Scheduled Date</th>
                    <th>Activity / Expense</th>
                    <th>Category</th>
                    <th>Leg / Section</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((item, idx) => {
                    const catKey = (item.activity_category || 'other').toLowerCase();
                    const icon = CATEGORY_ICONS[catKey] || '🏷️';
                    const costVal = parseFloat(item.cost) || 0;

                    return (
                      <tr key={item.id || idx}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {item.scheduled_date ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{new Date(item.scheduled_date).toLocaleDateString()}</div>
                              {item.scheduled_time && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                  <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                  {item.scheduled_time.substring(0, 5)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>Date TBD</span>
                          )}
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.activity_name || 'Activity'}</div>
                        </td>

                        <td>
                          <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {icon} {catKey}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.sectionTitle}</div>
                        </td>

                        <td style={{ maxWidth: '200px' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>
                            {item.notes || '—'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="budget-table-cost">
                            ${costVal.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
