/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [city]
 * @property {string} [country]
 * @property {string} [additional_info]
 * @property {boolean} is_admin
 * @property {string} created_at
 */

/**
 * @typedef {Object} City
 * @property {string} id
 * @property {string} name
 * @property {string} country
 * @property {string} [image_url]
 * @property {string} cost_index
 * @property {number} popularity_score
 */

/**
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} [description]
 * @property {number} cost
 * @property {number} duration_mins
 * @property {string} [image_url]
 * @property {string} city_id
 */

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} [description]
 * @property {string} [cover_photo_url]
 * @property {string} status - 'upcoming', 'ongoing', 'completed'
 * @property {string} created_at
 */

/**
 * @typedef {Object} Section
 * @property {string} id
 * @property {string} trip_id
 * @property {string} [city_id]
 * @property {string} title
 * @property {string} [description]
 * @property {string} start_date
 * @property {string} end_date
 * @property {number} budget
 * @property {number} order_index
 */

/**
 * @typedef {Object} TripActivity
 * @property {string} id
 * @property {string} section_id
 * @property {string} activity_id
 * @property {string} scheduled_date
 * @property {string} [scheduled_time]
 * @property {number} [cost_override]
 * @property {string} [notes]
 * @property {Activity} activity
 */

/**
 * @typedef {Object} ItineraryDay
 * @property {string} date
 * @property {Array<{section: Section, activities: Array<TripActivity>}>} sections
 */

/**
 * @typedef {Object} TripItinerary
 * @property {Trip} trip
 * @property {Array<ItineraryDay>} days
 */

/**
 * @typedef {Object} TripBudget
 * @property {number} total
 * @property {Record<string, number>} by_category
 * @property {Record<string, number>} by_day
 * @property {number} average_daily
 */

/**
 * @typedef {Object} SearchResult
 * @property {Array<City>} cities
 * @property {Array<Trip>} trips
 */

export {};
