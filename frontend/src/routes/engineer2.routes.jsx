import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { MyTrips } from '../pages/my-trips/MyTrips';
import { Profile } from '../pages/profile/Profile';
import { ActivitySearch } from '../pages/search/ActivitySearch';
import { Community } from '../pages/community/Community';
import { Calendar } from '../pages/calendar/Calendar';
import { AdminPanel } from '../pages/admin/AdminPanel';

export const engineer2Routes = [
  <Route key="e2-protected" element={<ProtectedRoute />}>
    <Route path="/my-trips" element={<MyTrips />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/search" element={<ActivitySearch />} />
    <Route path="/community" element={<Community />} />
    <Route path="/calendar" element={<Calendar />} />
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
];
