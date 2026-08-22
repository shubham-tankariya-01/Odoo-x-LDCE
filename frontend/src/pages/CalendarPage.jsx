import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTrips, getItinerary } from '../api/client';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [trips, setTrips] = useState([]);
  const [itineraries, setItineraries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripsAndItineraries();
  }, [currentDate]);

  const fetchTripsAndItineraries = async () => {
    setLoading(true);
    try {
      const tripsData = await listTrips({ owner: 'me' });
      setTrips(tripsData);
      
      const itins = {};
      for (const t of tripsData) {
        try {
          const itinData = await getItinerary(t.id);
          itins[t.id] = itinData;
        } catch (e) {
        }
      }
      setItineraries(itins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  const remaining = 42 - days.length; 
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  const getEventsForDay = (dateObj) => {
    const compareDate = new Date(dateObj);
    compareDate.setHours(0,0,0,0);
    const dateStr = compareDate.toISOString().split('T')[0];
    
    const events = [];

    trips.forEach(trip => {
      const start = new Date(trip.start_date); start.setHours(0,0,0,0);
      const end = new Date(trip.end_date); end.setHours(0,0,0,0);
      
      if (compareDate >= start && compareDate <= end) {
        const isStart = compareDate.getTime() === start.getTime();
        const isEnd = compareDate.getTime() === end.getTime();
        
        // Push the continuous trip strip event
        events.push({
          id: `trip-${trip.id}-${dateStr}`,
          title: isStart ? trip.name : '\u00A0', // only show name on first day
          tripId: trip.id,
          type: 'trip',
          className: `trip ${isStart ? 'trip-start' : ''} ${isEnd ? 'trip-end' : ''} ${!isStart && !isEnd ? 'trip-middle' : ''}`
        });
        
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
                    className: 'activity'
                  });
                }
              });
            }
          });
        }
      }
    });

    return events;
  };

  return (
    <div className="calendar-page">
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        <div className="calendar-header">
          <div>
            <h1 className="calendar-title">Calendar</h1>
            <p className="calendar-subtitle">Your upcoming trips and scheduled activities.</p>
          </div>
          
          <div className="calendar-nav">
            <button className="calendar-nav-today" onClick={goToToday}>Today</button>
            <div className="calendar-nav-sep"></div>
            <button className="calendar-nav-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2 className="calendar-nav-month">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="calendar-nav-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="calendar-container">
          {loading ? (
            <div className="calendar-loading">
              <div className="spinner"></div>
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
                    className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasTrip ? 'has-event' : ''}`}
                    onClick={() => {
                      if (events.length > 0) {
                        navigate(`/trips/${events[0].tripId}`);
                      }
                    }}
                  >
                    <div className="calendar-day-num">{dayObj.date.getDate()}</div>
                    <div className="calendar-events">
                      {events.slice(0, 3).map((ev, idx) => (
                        <div 
                          key={ev.id || idx} 
                          className={`calendar-event ${ev.className}`}
                          title={`${ev.time ? ev.time + ' ' : ''}${ev.title}`}
                        >
                          {ev.time && <span style={{ opacity: 0.8, marginRight: '4px' }}>{ev.time}</span>}
                          {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="calendar-event-more">+{events.length - 3} more</div>
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
