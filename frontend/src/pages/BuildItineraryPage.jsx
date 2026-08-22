import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  listSections, 
  createSection, 
  updateSection, 
  deleteSection, 
  reorderSections,
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  getItinerary
} from '../api/client';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign, 
  AlignLeft,
  ArrowRight,
  Search
} from 'lucide-react';

// Sortable Section Item
function SortableSection({ section, onDelete, onUpdate, onAddActivity, onUpdateActivity, onDeleteActivity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative'
  };

  const [localTitle, setLocalTitle] = useState(section.title);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Debounced update for title
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== section.title) {
        onUpdate(section.id, { title: localTitle });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localTitle, section.id, section.title, onUpdate]);

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-section ${isDragging ? 'shadow-xl border-primary' : ''}`}>
      <div className="itinerary-section-header">
        <div {...attributes} {...listeners} className="cursor-grab text-muted hover:text-primary">
          <GripVertical size={20} />
        </div>
        <input 
          type="text" 
          className="font-display text-xl font-semibold bg-transparent border-none outline-none w-full"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Section Title (e.g. Days 1-3: Paris)"
        />
        <div className="flex gap-2 shrink-0">
          <button 
            type="button" 
            className="btn btn-ghost btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm text-danger"
            onClick={() => onDelete(section.id)}
            title="Delete Section"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="itinerary-section-body">
          <div className="section-form-grid">
            <div className="input-group">
              <label className="input-label text-xs">Dates</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="input" 
                  style={{ minHeight: '36px', padding: '6px 12px' }}
                  value={section.start_date ? section.start_date.split('T')[0] : ''}
                  onChange={(e) => onUpdate(section.id, { start_date: e.target.value })}
                />
                <span className="text-muted">to</span>
                <input 
                  type="date" 
                  className="input" 
                  style={{ minHeight: '36px', padding: '6px 12px' }}
                  value={section.end_date ? section.end_date.split('T')[0] : ''}
                  onChange={(e) => onUpdate(section.id, { end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label text-xs">Section Budget ($)</label>
              <input 
                type="number" 
                className="input" 
                style={{ minHeight: '36px', padding: '6px 12px' }}
                value={section.budget || ''}
                onChange={(e) => onUpdate(section.id, { budget: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 1500"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label text-xs">Description</label>
            <input 
              type="text" 
              className="input" 
              style={{ minHeight: '36px', padding: '6px 12px' }}
              value={section.description || ''}
              onChange={(e) => onUpdate(section.id, { description: e.target.value })}
              placeholder="What's the vibe for this part of the trip?"
            />
          </div>

          <div className="divider" style={{ margin: 'var(--space-3) 0' }}></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Activities</h4>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => onAddActivity(section.id)}
              >
                <Plus size={14} /> Add Activity
              </button>
            </div>

            {(!section.activities || section.activities.length === 0) ? (
              <div className="text-center p-4 border border-dashed border-border rounded-sm text-muted text-sm">
                No activities added yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {section.activities.map(sa => (
                  <div key={sa.id} className="activity-item">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{sa.activity?.name || 'Unknown Activity'}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-secondary">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {new Date(sa.scheduled_date).toLocaleDateString()}
                        </span>
                        {sa.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {sa.scheduled_time.substring(0, 5)}
                          </span>
                        )}
                        {sa.cost_override !== null && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} /> {sa.cost_override}
                          </span>
                        )}
                      </div>
                      {sa.notes && (
                        <div className="text-xs text-muted mt-2 flex items-start gap-1">
                          <AlignLeft size={12} className="mt-0.5" /> {sa.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm text-danger h-8 w-8 p-0 flex items-center justify-center"
                        onClick={() => onDeleteActivity(sa.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export function BuildItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Activity Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  
  // New Activity Form State
  const [newActivity, setNewActivity] = useState({
    activity_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchSectionsAndActivities();
    getActivities().then(res => {
      setCatalog(Array.isArray(res) ? res : res.items || []);
    }).catch(console.error);
  }, [tripId]);

  const fetchSectionsAndActivities = async () => {
    try {
      // The API returns sections for a trip, but we need their activities too.
      // To get a holistic view, getItinerary might be richer, or listSections if it includes activities.
      // Let's use getItinerary to get the full tree, then extract sections if we can,
      // or just listSections and we'll assume it returns the nested activities.
      // Based on typical nested schemas, listSections usually returns activities.
      const data = await listSections(tripId);
      setSections(data.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Fire API call to reorder optimistically
        reorderSections(tripId, newOrder.map(s => s.id)).catch(err => {
          console.error("Failed to reorder", err);
          fetchSectionsAndActivities(); // Rollback on fail
        });
        
        return newOrder;
      });
    }
  };

  const handleAddSection = async () => {
    try {
      const newSection = await createSection(tripId, {
        title: `Section ${sections.length + 1}`,
        description: "",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        budget: 0
      });
      setSections([...sections, newSection]);
    } catch (err) {
      console.error("Failed to create section", err);
    }
  };

  const handleUpdateSection = async (sectionId, payload) => {
    try {
      await updateSection(sectionId, payload);
      setSections(sections.map(s => s.id === sectionId ? { ...s, ...payload } : s));
    } catch (err) {
      console.error("Failed to update section", err);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return;
    try {
      await deleteSection(sectionId);
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error("Failed to delete section", err);
    }
  };

  const openActivityModal = (sectionId) => {
    setActiveSectionId(sectionId);
    setNewActivity({ activity_id: '', scheduled_date: '', scheduled_time: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    if (!newActivity.activity_id || !newActivity.scheduled_date) return;
    
    try {
      const payload = { ...newActivity };
      if (!payload.scheduled_time) delete payload.scheduled_time;
      if (!payload.notes) delete payload.notes;

      await addActivity(activeSectionId, payload);
      setIsModalOpen(false);
      fetchSectionsAndActivities(); // Refresh to get full nested data
    } catch (err) {
      console.error("Failed to add activity", err);
      alert(err.message);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Remove this activity?")) return;
    try {
      await deleteActivity(activityId);
      fetchSectionsAndActivities();
    } catch (err) {
      console.error("Failed to delete activity", err);
    }
  };

  const filteredCatalog = catalog.filter(a => a.name.toLowerCase().includes(searchCatalog.toLowerCase()));

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title mb-1">Build Itinerary</h1>
            <p className="text-secondary">Organize your trip into sections (e.g. cities, legs) and add activities.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/trips/${tripId}`)}
            disabled={sections.length === 0}
          >
            Review Full Itinerary <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="skeleton skeleton-card h-32"></div>
            <div className="skeleton skeleton-card h-32"></div>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sections.map(section => (
                    <SortableSection 
                      key={section.id} 
                      section={section} 
                      onUpdate={handleUpdateSection}
                      onDelete={handleDeleteSection}
                      onAddActivity={openActivityModal}
                      onDeleteActivity={handleDeleteActivity}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button 
              className="w-full mt-6 py-4 border-2 border-dashed border-border rounded-md text-primary font-medium hover:bg-surface hover:border-primary-muted transition-colors flex items-center justify-center gap-2"
              onClick={handleAddSection}
            >
              <Plus size={20} /> Add Another Section
            </button>
          </div>
        )}

      </div>

      {/* Add Activity Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Activity</h3>
              <button className="btn-ghost p-1 rounded-full" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddActivitySubmit}>
              <div className="modal-body flex flex-col gap-4">
                
                <div className="input-group">
                  <label className="input-label">Select Activity <span className="required">*</span></label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      className="input" 
                      style={{ paddingLeft: '32px', minHeight: '36px' }}
                      placeholder="Filter catalog..."
                      value={searchCatalog}
                      onChange={(e) => setSearchCatalog(e.target.value)}
                    />
                  </div>
                  <div className="border border-border rounded-sm max-h-[160px] overflow-y-auto bg-surface-2 p-1">
                    {filteredCatalog.length > 0 ? filteredCatalog.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-2 rounded-sm cursor-pointer text-sm flex justify-between items-center ${newActivity.activity_id === item.id ? 'bg-primary-muted text-primary font-medium' : 'hover:bg-surface'}`}
                        onClick={() => setNewActivity(prev => ({ ...prev, activity_id: item.id }))}
                      >
                        <span>{item.name}</span>
                        <span className="text-xs opacity-70">${item.estimated_cost}</span>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-xs text-muted">No activities found</div>
                    )}
                  </div>
                </div>

                <div className="grid-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Date <span className="required">*</span></label>
                    <input 
                      type="date" 
                      className="input" 
                      value={newActivity.scheduled_date} 
                      onChange={(e) => setNewActivity(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Time</label>
                    <input 
                      type="time" 
                      className="input" 
                      value={newActivity.scheduled_time} 
                      onChange={(e) => setNewActivity(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Notes</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Confirmation numbers, meeting spot..."
                    value={newActivity.notes} 
                    onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newActivity.activity_id || !newActivity.scheduled_date}>
                  Add to Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
