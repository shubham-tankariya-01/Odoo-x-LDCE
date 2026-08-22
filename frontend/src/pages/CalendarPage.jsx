import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTrips, getItinerary } from '../api/client';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [trips, setTrips] = useState([]);
  const [itineraries, setItineraries] = useState({}); // tripId -> itinerary data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripsAndItineraries();
  }, [currentDate]); // Could refetch or cache based on month, simple enough to fetch all

  const fetchTripsAndItineraries = async () => {
    setLoading(true);
    try {
      const tripsData = await listTrips({ owner: 'me' });
      setTrips(tripsData);
      
      // Fetch itineraries for active/upcoming trips to plot activities
      // Optimization: Only fetch itineraries for trips that overlap with current month
      // For now, fetch for all trips or top N to keep simple
      const itins = {};
      for (const t of tripsData) {
        try {
          const itinData = await getItinerary(t.id);
          itins[t.id] = itinData;
        } catch (e) {
          // ignore error for a single trip
        }
      }
      setItineraries(itins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  // Pad previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Pad next month
  const remaining = 42 - days.length; // 6 rows of 7
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  // Helper to get events for a day
  const getEventsForDay = (dateObj) => {
    // Zero out time for comparison
    const compareDate = new Date(dateObj);
    compareDate.setHours(0,0,0,0);
    const dateStr = compareDate.toISOString().split('T')[0];
    
    const events = [];

    // Check trips spanning this day
    trips.forEach(trip => {
      const start = new Date(trip.start_date); start.setHours(0,0,0,0);
      const end = new Date(trip.end_date); end.setHours(0,0,0,0);
      
      if (compareDate >= start && compareDate <= end) {
        // Look for specific activities on this day
        let hasSpecificActivity = false;
        
        if (itineraries[trip.id] && itineraries[trip.id].sections) {
          itineraries[trip.id].sections.forEach(sec => {
            if (sec.activities) {
              sec.activities.forEach(act => {
                if (act.scheduled_date.startsWith(dateStr)) {
                  events.push({
                    id: act.id,
                    title: act.activity?.name || 'Activity',
                    time: act.scheduled_time ? act.scheduled_time.substring(0, 5) : '',
                    tripId: trip.id,
                    type: 'activity',
                    color: 'var(--color-primary)'
                  });
                  hasSpecificActivity = true;
                }
              });
            }
          });
        }
        
        // If no specific activity, just mark the trip day
        if (!hasSpecificActivity) {
          events.push({
            id: `trip-${trip.id}-${dateStr}`,
            title: trip.name,
            tripId: trip.id,
            type: 'trip',
            color: 'var(--color-secondary)'
          });
        }
      }
    });

    return events;
  };

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="page-header flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="page-title">Calendar</h1>
            <p className="page-subtitle">Your upcoming trips and scheduled activities.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-surface p-2 rounded-md shadow-sm border border-border">
            <button className="btn btn-ghost btn-sm" onClick={goToToday}>Today</button>
            <div className="h-6 w-px bg-border"></div>
            <button className="btn btn-ghost btn-sm p-1" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2 className="font-display font-semibold text-lg w-40 text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="btn btn-ghost btn-sm p-1" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="card p-0 shadow-md">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : (
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              
              {days.map((dayObj, i) => {
                dayObj.date.setHours(0,0,0,0);
                const isToday = dayObj.date.getTime() === today.getTime();
                const events = getEventsForDay(dayObj.date);
                const hasTrip = events.length > 0;
                
                return (
                  <div 
                    key={i} 
                    className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasTrip ? 'has-trip' : ''}`}
                    onClick={() => {
                      if (events.length > 0) {
                        navigate(`/trips/${events[0].tripId}`);
                      } else {
                        // Could link to create trip with pre-filled dates, but standard is just view
                      }
                    }}
                  >
                    <div className="calendar-day-num">{dayObj.date.getDate()}</div>
                    <div className="flex flex-col mt-1 h-full overflow-hidden">
                      {events.slice(0, 3).map((ev, idx) => (
                        <div 
                          key={ev.id || idx} 
                          className="calendar-event"
                          style={{ backgroundColor: ev.type === 'activity' ? 'var(--color-primary)' : 'var(--color-upcoming)' }}
                          title={`${ev.time ? ev.time + ' ' : ''}${ev.title}`}
                        >
                          {ev.time && <span className="opacity-80 mr-1">{ev.time}</span>}
                          {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-xs text-secondary font-medium mt-1">+{events.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
