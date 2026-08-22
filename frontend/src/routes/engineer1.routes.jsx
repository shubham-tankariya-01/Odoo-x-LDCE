import React from 'react';
import { Route } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Landing } from '../pages/Landing';
import { CreateTrip } from '../pages/trips/CreateTrip';
import { BuildItinerary } from '../pages/trips/BuildItinerary';
import { ItineraryView } from '../pages/trips/ItineraryView';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

export const engineer1Routes = [
  <Route key="landing" path="/" element={<Landing />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="register" path="/register" element={<Register />} />,
  <Route key="e1-protected" element={<ProtectedRoute />}>
    <Route path="/trips/new" element={<CreateTrip />} />
    <Route path="/trips/:tripId/build" element={<BuildItinerary />} />
    <Route path="/trips/:tripId/itinerary" element={<ItineraryView />} />
  </Route>
];
