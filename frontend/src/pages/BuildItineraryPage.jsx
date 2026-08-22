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
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Edit2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  Loader2,
  X
} from 'lucide-react';


const CATEGORIES = [
  { id: 'all', label: 'All Activities' },
  { id: 'dining', label: '🍽️ Dining & Food' },
  { id: 'sightseeing', label: '🏛️ Sightseeing' },
  { id: 'adventure', label: '🧗 Adventure' },
  { id: 'water', label: '🏊 Water & Beach' },
  { id: 'culture', label: '🎨 Culture & Arts' },
  { id: 'relaxation', label: '🧘 Relaxation & Spa' },
  { id: 'nightlife', label: '🍸 Nightlife' },
  { id: 'shopping', label: '🛍️ Shopping' }
];

function SortableSection({ 
  section, 
  tripDates,
  onDelete, 
  onUpdate, 
  onAddActivity, 
  onEditActivity, 
  onDeleteActivity 
}) {
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
    zIndex: isDragging ? 50 : 1,
    position: 'relative'
  };

  const [localTitle, setLocalTitle] = useState(section.title || '');
  const [localStartDate, setLocalStartDate] = useState(section.start_date ? section.start_date.split('T')[0] : '');
  const [localEndDate, setLocalEndDate] = useState(section.end_date ? section.end_date.split('T')[0] : '');
  const [localBudget, setLocalBudget] = useState(section.budget !== undefined && section.budget !== null ? section.budget : '');
  const [localDesc, setLocalDesc] = useState(section.description || '');
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Sync state when prop updates from external save
  useEffect(() => {
    setLocalTitle(section.title || '');
    setLocalStartDate(section.start_date ? section.start_date.split('T')[0] : '');
    setLocalEndDate(section.end_date ? section.end_date.split('T')[0] : '');
    setLocalBudget(section.budget !== undefined && section.budget !== null ? section.budget : '');
    setLocalDesc(section.description || '');
  }, [section.id]);

  const saveChanges = (overrides = {}) => {
    const payload = {
      title: overrides.title !== undefined ? overrides.title : localTitle,
      start_date: overrides.start_date !== undefined ? overrides.start_date : localStartDate,
      end_date: overrides.end_date !== undefined ? overrides.end_date : localEndDate,
      budget: overrides.budget !== undefined ? parseFloat(overrides.budget) || 0 : (parseFloat(localBudget) || 0),
      description: overrides.description !== undefined ? overrides.description : localDesc
    };
    onUpdate(section.id, payload);
  };

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      const sDate = section.start_date ? section.start_date.split('T')[0] : '';
      const eDate = section.end_date ? section.end_date.split('T')[0] : '';
      const bVal = section.budget !== undefined && section.budget !== null ? section.budget : '';

      const hasChanges = 
        localTitle !== (section.title || '') ||
        localStartDate !== sDate ||
        localEndDate !== eDate ||
        (parseFloat(localBudget) || 0) !== (parseFloat(bVal) || 0) ||
        localDesc !== (section.description || '');

      if (hasChanges) {
        saveChanges();
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [localTitle, localStartDate, localEndDate, localBudget, localDesc]);

  return (
    <div ref={setNodeRef} style={style} className={`builder-section-card ${isDragging ? 'dragging' : ''} mb-4`}>
      {/* Header */}
      <div className="builder-section-header">
        <div {...attributes} {...listeners} className="builder-section-drag" title="Drag to reorder section">
          <GripVertical size={22} />
        </div>
        <input 
          type="text" 
          className="builder-section-title-input"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => saveChanges()}
          placeholder="Section Title (e.g. Days 1-3: Delhi & Taj Mahal)"
        />
        <div className="builder-section-actions">
          <button 
            type="button" 
            className="builder-section-action-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Section" : "Expand Section"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button 
            type="button" 
            className="builder-section-action-btn danger"
            onClick={() => onDelete(section.id)}
            title="Delete Section"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      
      {/* Body */}
      {isExpanded && (
        <div className="builder-section-body">
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Section Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="date" 
                  className="input"
                  value={localStartDate}
                  min={tripDates?.start_date}
                  max={localEndDate || tripDates?.end_date}
                  onChange={(e) => {
                    setLocalStartDate(e.target.value);
                  }}
                  onBlur={() => saveChanges()}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>to</span>
                <input 
                  type="date" 
                  className="input"
                  value={localEndDate}
                  min={localStartDate || tripDates?.start_date}
                  max={tripDates?.end_date}
                  onChange={(e) => {
                    setLocalEndDate(e.target.value);
                  }}
                  onBlur={() => saveChanges()}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Section Budget ($)</label>
              <input 
                type="number" 
                className="input"
                value={localBudget}
                onChange={(e) => setLocalBudget(e.target.value)}
                onBlur={() => saveChanges()}
                placeholder="e.g. 500"
                min="0"
                step="any"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Notes & Highlights</label>
            <input 
              type="text" 
              className="input"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={() => saveChanges()}
              placeholder="What's the plan or vibe for this section of your trip?"
            />
          </div>

          <div className="builder-section-divider"></div>

          <div>
            <div className="builder-section-activities-header">
              <div>
                <h4 className="builder-section-activities-title">Planned Activities</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  {section.activities?.length || 0} {section.activities?.length === 1 ? 'activity' : 'activities'} scheduled
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => onAddActivity(section)}
              >
                <Plus size={16} /> Add Activity
              </button>
            </div>

            {(!section.activities || section.activities.length === 0) ? (
              <div className="empty-state" style={{ padding: '28px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  No activities added yet for this section.
                </p>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => onAddActivity(section)}
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <Plus size={16} /> Select an Activity
                </button>
              </div>
            ) : (
              <div className="builder-activity-list p-0">
                {section.activities.map(sa => (
                  <div key={sa.id} className="builder-activity-item group">
                    <div className="flex-1">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div className="builder-activity-item-title" style={{ margin: 0 }}>
                          {sa.activity_name || 'Activity'}
                        </div>
                        {sa.cost !== null && sa.cost !== undefined && (
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>
                            <DollarSign size={13} /> {sa.cost}
                          </span>
                        )}
                      </div>
                      
                      <div className="builder-activity-item-meta">
                        <span className="badge badge-neutral">
                          <MapPin size={14} className="text-primary opacity-70" /> 
                          {sa.scheduled_date ? new Date(sa.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unscheduled'}
                        </span>
                        {sa.scheduled_time && (
                          <span className="badge badge-neutral">
                            <Clock size={14} className="text-primary opacity-70" /> {sa.scheduled_time.substring(0, 5)}
                          </span>
                        )}
                        {sa.activity_category && (
                          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                            {sa.activity_category}
                          </span>
                        )}
                      </div>
                      
                      {sa.notes && (
                        <div className="builder-activity-item-notes">
                          <AlignLeft size={16} style={{ opacity: 0.5, flexShrink: 0 }} /> {sa.notes}
                        </div>
                      )}
                    </div>

                    <div className="builder-activity-item-actions">
                      <button 
                        type="button" 
                        className="builder-section-action-btn"
                        onClick={() => onEditActivity(section, sa)}
                        title="Edit Activity Details"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="builder-section-action-btn danger"
                        onClick={() => onDeleteActivity(sa.id)}
                        title="Remove Activity"
                      >
                        <Trash2 size={16} />
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
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  
  // Add Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionModalForm, setSectionModalForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
    budget: '',
    description: ''
  });
  const [sectionModalError, setSectionModalError] = useState('');
  
  // Catalog & Search State
  const [catalog, setCatalog] = useState([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Add/Edit Activity Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [editingActivityId, setEditingActivityId] = useState(null);
  
  const [activityForm, setActivityForm] = useState({
    activity_id: '',
    activity_name: '',
    activity_category: '',
    scheduled_date: '',
    scheduled_time: '',
    cost: '',
    notes: ''
  });

  const [dateError, setDateError] = useState('');

  const isWorking = loading || isCreatingSection || isSavingActivity || isSaving;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getEstimatedCost = (item) => {
    if (item.cost !== undefined && item.cost !== null) return item.cost;
    if (item.estimated_cost) return item.estimated_cost;
    let hash = 0;
    const str = item.id || item.name || '';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash) % 120) + 15;
  };

  const getEstimatedDuration = (item) => {
    if (item.duration_mins) {
      if (item.duration_mins >= 60) {
        const hrs = (item.duration_mins / 60).toFixed(item.duration_mins % 60 !== 0 ? 1 : 0);
        return `${hrs} hr${hrs > 1 ? 's' : ''}`;
      }
      return `${item.duration_mins} mins`;
    }
    return '1-2 hrs';
  };

  useEffect(() => {
    fetchSectionsAndTrip();
    getActivities().then(res => {
      setCatalog(Array.isArray(res) ? res : res.items || []);
    }).catch(console.error);
  }, [tripId]);

  const fetchSectionsAndTrip = async () => {
    try {
      const tripData = await getItinerary(tripId);
      if (tripData) {
        const sortedSections = (tripData.sections || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        setSections(sortedSections);
        setTrip(tripData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        setIsSaving(true);
        reorderSections(tripId, newOrder.map(s => s.id))
          .catch(err => {
            console.error("Failed to reorder", err);
            fetchSectionsAndTrip();
          })
          .finally(() => setIsSaving(false));
        
        return newOrder;
      });
    }
  };

  const openAddSectionModal = () => {
    const sDate = trip?.start_date ? trip.start_date.split('T')[0] : '';
    const eDate = trip?.end_date ? trip.end_date.split('T')[0] : sDate;

    setSectionModalForm({
      title: `Section ${sections.length + 1}`,
      start_date: sDate,
      end_date: eDate,
      budget: '',
      description: ''
    });
    setSectionModalError('');
    setIsSectionModalOpen(true);
  };

  const handleSectionModalSubmit = async (e) => {
    e.preventDefault();
    if (!sectionModalForm.title.trim()) {
      setSectionModalError("Please give this section a title.");
      return;
    }
    if (!sectionModalForm.start_date || !sectionModalForm.end_date) {
      setSectionModalError("Please specify section dates.");
      return;
    }
    if (sectionModalForm.end_date < sectionModalForm.start_date) {
      setSectionModalError("End date cannot be earlier than start date.");
      return;
    }

    setIsCreatingSection(true);
    setSectionModalError('');

    try {
      await createSection(tripId, {
        title: sectionModalForm.title.trim(),
        description: sectionModalForm.description?.trim() || "",
        start_date: sectionModalForm.start_date,
        end_date: sectionModalForm.end_date,
        budget: sectionModalForm.budget !== '' ? parseFloat(sectionModalForm.budget) : 0
      });
      await fetchSectionsAndTrip();
      setIsSectionModalOpen(false);
    } catch (err) {
      console.error("Failed to create section", err);
      setSectionModalError(err.message || "Failed to create section. Please try again.");
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleUpdateSection = async (sectionId, payload) => {
    setIsSaving(true);
    try {
      await updateSection(sectionId, payload);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...payload } : s));
    } catch (err) {
      console.error("Failed to update section", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Are you sure you want to delete this section and all its activities?")) return;
    setIsSaving(true);
    try {
      await deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error("Failed to delete section", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Date validation helper (No alerts, returns message if error)
  const validateDateAgainstSection = (dateStr, sec) => {
    if (!dateStr || !sec) return '';
    const sDate = sec.start_date ? sec.start_date.split('T')[0] : '';
    const eDate = sec.end_date ? sec.end_date.split('T')[0] : '';
    
    if (sDate && dateStr < sDate) {
      return `Activity date (${dateStr}) cannot be before section start date (${sDate}).`;
    }
    if (eDate && dateStr > eDate) {
      return `Activity date (${dateStr}) cannot be after section end date (${eDate}).`;
    }
    return '';
  };

  const openAddActivityModal = (section) => {
    setActiveSection(section);
    setIsEditMode(false);
    setEditingActivityId(null);
    setDateError('');

    // Default to section start date or trip start date
    const defaultDate = section.start_date 
      ? section.start_date.split('T')[0] 
      : (trip?.start_date ? trip.start_date.split('T')[0] : '');

    setActivityForm({
      activity_id: '',
      activity_name: '',
      activity_category: '',
      scheduled_date: defaultDate,
      scheduled_time: '10:00',
      cost: '',
      notes: ''
    });
    setSearchCatalog('');
    setSelectedCategory('all');
    setIsModalOpen(true);
  };

  const openEditActivityModal = (section, act) => {
    setActiveSection(section);
    setIsEditMode(true);
    setEditingActivityId(act.id);
    setDateError('');

    const formattedDate = act.scheduled_date ? act.scheduled_date.split('T')[0] : '';

    setActivityForm({
      activity_id: act.activity_id || '',
      activity_name: act.activity_name || '',
      activity_category: act.activity_category || '',
      scheduled_date: formattedDate,
      scheduled_time: act.scheduled_time ? act.scheduled_time.substring(0, 5) : '',
      cost: act.cost !== null && act.cost !== undefined ? act.cost : '',
      notes: act.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSelectActivityItem = (item) => {
    const costVal = getEstimatedCost(item);
    setActivityForm(prev => ({
      ...prev,
      activity_id: item.id,
      activity_name: item.name,
      activity_category: item.category || 'general',
      cost: costVal
    }));
  };

  const handleDateChange = (newDate) => {
    const err = validateDateAgainstSection(newDate, activeSection);
    setDateError(err);
    setActivityForm(prev => ({ ...prev, scheduled_date: newDate }));
  };

  const handleActivityModalSubmit = async (e) => {
    e.preventDefault();
    if (!activityForm.activity_id || !activityForm.scheduled_date) return;
    
    const err = validateDateAgainstSection(activityForm.scheduled_date, activeSection);
    if (err) {
      setDateError(err);
      return;
    }

    setIsSavingActivity(true);

    try {
      if (isEditMode) {
        // Update existing activity
        const payload = {
          scheduled_date: activityForm.scheduled_date,
          scheduled_time: activityForm.scheduled_time || null,
          cost_override: activityForm.cost !== '' ? parseFloat(activityForm.cost) : null,
          notes: activityForm.notes || null
        };
        await updateActivity(editingActivityId, payload);
      } else {
        // Add new activity
        const payload = {
          activity_id: activityForm.activity_id,
          scheduled_date: activityForm.scheduled_date,
          scheduled_time: activityForm.scheduled_time || null,
          cost_override: activityForm.cost !== '' ? parseFloat(activityForm.cost) : null,
          notes: activityForm.notes || null
        };
        await addActivity(activeSection.id, payload);
      }
      
      setIsModalOpen(false);
      await fetchSectionsAndTrip();
    } catch (err) {
      console.error("Failed to save activity", err);
      setDateError(err.message || "Failed to save activity");
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Remove this activity from your itinerary?")) return;
    setIsSaving(true);
    try {
      await deleteActivity(activityId);
      await fetchSectionsAndTrip();
    } catch (err) {
      console.error("Failed to delete activity", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Catalog by category and search
  const filteredCatalog = catalog.filter(a => {
    const matchesSearch = !searchCatalog || 
      a.name.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      (a.category && a.category.toLowerCase().includes(searchCatalog.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(searchCatalog.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      (a.category && a.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const sectionStartDate = activeSection?.start_date ? activeSection.start_date.split('T')[0] : '';
  const sectionEndDate = activeSection?.end_date ? activeSection.end_date.split('T')[0] : '';

  return (
    <div className="builder-page">
      {/* Top Progress Loading Indicator */}
      {isWorking && <div className="builder-header-progress" />}

      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <div className="builder-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <button onClick={() => navigate('/trips')} className="builder-back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--color-text-3)' }}>
                <ArrowLeft size={16} /> Back to Trips
              </button>
              <span className={`builder-save-status ${isSaving ? 'saving' : 'saved'}`}>
                {isSaving ? (
                  <><Loader2 size={12} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={12} /> All changes saved</>
                )}
              </span>
            </div>
            <h1 className="builder-title">{trip?.name || 'Build Itinerary'}</h1>
            <p className="builder-meta">
              {trip?.start_date && trip?.end_date ? (
                <>
                  <Calendar size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {new Date(trip.start_date).toLocaleDateString()} – {new Date(trip.end_date).toLocaleDateString()} • {sections.length} {sections.length === 1 ? 'section' : 'sections'}
                </>
              ) : (
                'Organize your trip into sections and schedule activities.'
              )}
            </p>
          </div>
          
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/trips/${tripId}`)}
            disabled={sections.length === 0}
          >
            Review Full Itinerary <ArrowRight size={20} />
          </button>
        </div>

        {/* Main Sections */}
        {loading ? (
          <div className="builder-main">
            <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }}></div>
            <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }}></div>
          </div>
        ) : (
          <div className="builder-main">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {sections.map(section => (
                    <SortableSection 
                      key={section.id} 
                      section={section} 
                      tripDates={{
                        start_date: trip?.start_date ? trip.start_date.split('T')[0] : '',
                        end_date: trip?.end_date ? trip.end_date.split('T')[0] : ''
                      }}
                      onUpdate={handleUpdateSection}
                      onDelete={handleDeleteSection}
                      onAddActivity={openAddActivityModal}
                      onEditActivity={openEditActivityModal}
                      onDeleteActivity={handleDeleteActivity}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button 
              className="builder-add-section-btn"
              onClick={openAddSectionModal}
              disabled={isCreatingSection}
            >
              {isCreatingSection ? (
                <>
                  <Loader2 size={24} className="animate-spin" /> Adding Section...
                </>
              ) : (
                <>
                  <Plus size={24} /> Add Another Section
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Add Section Modal Dialog */}
      {isSectionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSectionModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add New Section / Leg</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  Trip: {trip?.name || 'Current Trip'}
                </p>
              </div>
              <button className="builder-section-action-btn" onClick={() => setIsSectionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSectionModalSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {sectionModalError && (
                  <div className="builder-date-error">
                    <AlertTriangle size={16} />
                    <span>{sectionModalError}</span>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Section Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="e.g. Kyoto Leg, Rome Sightseeing, Beach Stay"
                    value={sectionModalForm.title}
                    onChange={e => setSectionModalForm({ ...sectionModalForm, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Start Date <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="date" 
                      className="input"
                      value={sectionModalForm.start_date}
                      min={trip?.start_date ? trip.start_date.split('T')[0] : ''}
                      max={trip?.end_date ? trip.end_date.split('T')[0] : ''}
                      onChange={e => setSectionModalForm({ 
                        ...sectionModalForm, 
                        start_date: e.target.value,
                        end_date: sectionModalForm.end_date && sectionModalForm.end_date < e.target.value ? e.target.value : sectionModalForm.end_date
                      })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">End Date <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="date" 
                      className="input"
                      value={sectionModalForm.end_date}
                      min={sectionModalForm.start_date || (trip?.start_date ? trip.start_date.split('T')[0] : '')}
                      max={trip?.end_date ? trip.end_date.split('T')[0] : ''}
                      onChange={e => setSectionModalForm({ ...sectionModalForm, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Section Budget ($)</label>
                  <input 
                    type="number" 
                    className="input"
                    placeholder="e.g. 500"
                    min="0"
                    step="any"
                    value={sectionModalForm.budget}
                    onChange={e => setSectionModalForm({ ...sectionModalForm, budget: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Highlights / Notes (Optional)</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="What's the main goal or vibe for this section?"
                    value={sectionModalForm.description}
                    onChange={e => setSectionModalForm({ ...sectionModalForm, description: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsSectionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingSection || !sectionModalForm.title.trim()}>
                  {isCreatingSection ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating Section...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Create Section
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Add / Edit Activity Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{isEditMode ? 'Edit Activity' : 'Add Activity to Itinerary'}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  Section: {activeSection?.title || 'Trip Leg'}
                </p>
              </div>
              <button className="builder-section-action-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleActivityModalSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Activity Selection (Only in Add mode) */}
                {!isEditMode ? (
                  <div>
                    <label className="input-label" style={{ marginBottom: '8px' }}>
                      Choose Activity <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>

                    {/* Search row */}
                    <div className="builder-search-row">
                      <div className="builder-search-wrap">
                        <Search size={18} className="builder-search-icon" />
                        <input 
                          type="text" 
                          className="builder-search-input"
                          placeholder="Search activities (e.g. swimming, food tour, museum)..."
                          value={searchCatalog}
                          onChange={(e) => setSearchCatalog(e.target.value)}
                        />
                      </div>
                      {searchCatalog && (
                        <button 
                          type="button" 
                          className="builder-search-btn"
                          onClick={() => setSearchCatalog('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="builder-category-pills">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`builder-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat.id)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Checkbox-based Activity List */}
                    <div className="builder-activity-catalog">
                      {filteredCatalog.length > 0 ? (
                        filteredCatalog.map(item => {
                          const isChecked = activityForm.activity_id === item.id;
                          return (
                            <div 
                              key={item.id} 
                              className={`builder-activity-checkbox-item ${isChecked ? 'checked' : ''}`}
                              onClick={() => handleSelectActivityItem(item)}
                            >
                              <div className="builder-checkbox-box">
                                {isChecked && <Check size={14} />}
                              </div>
                              <div className="builder-activity-item-info">
                                <div className="builder-activity-name">{item.name}</div>
                                <div className="builder-activity-submeta">
                                  <span style={{ textTransform: 'capitalize' }}>🏷️ {item.category || 'General'}</span>
                                  <span>⏱️ {getEstimatedDuration(item)}</span>
                                </div>
                              </div>
                              <div className="builder-activity-cost-badge">
                                ${getEstimatedCost(item)}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-state" style={{ padding: '24px' }}>
                          <p style={{ color: 'var(--color-text-muted)' }}>No activities found matching your search.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Activity</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>
                      {activityForm.activity_name || 'Selected Activity'}
                    </div>
                  </div>
                )}

                {/* Date & Time with Inline Error Handling */}
                <div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">
                        Scheduled Date <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input 
                        type="date" 
                        className="input"
                        value={activityForm.scheduled_date}
                        min={sectionStartDate}
                        max={sectionEndDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Scheduled Time</label>
                      <input 
                        type="time" 
                        className="input"
                        value={activityForm.scheduled_time} 
                        onChange={(e) => setActivityForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Inline Error Message Banner (No Browser Alert) */}
                  {dateError && (
                    <div className="builder-date-error">
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{dateError}</span>
                    </div>
                  )}
                </div>

                {/* Cost Override */}
                <div className="input-group">
                  <label className="input-label">Estimated Cost / Budget ($)</label>
                  <input 
                    type="number" 
                    className="input"
                    placeholder="e.g. 50"
                    value={activityForm.cost}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, cost: e.target.value }))}
                    min="0"
                    step="any"
                  />
                </div>

                {/* Notes */}
                <div className="input-group">
                  <label className="input-label">Notes & Instructions (Optional)</label>
                  <textarea 
                    className="input"
                    style={{ minHeight: '70px', resize: 'vertical' }}
                    placeholder="Meeting point, booking reference, what to bring..."
                    value={activityForm.notes} 
                    onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!activityForm.activity_id || !activityForm.scheduled_date || !!dateError}
                >
                  {isEditMode ? 'Update Activity' : 'Add to Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
