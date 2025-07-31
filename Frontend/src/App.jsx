import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Signup from './components/Signup';
import Login from './components/Login';
import AddLead from './components/AddLead';
import Leads from './components/Leads';
import Lead from './components/Lead';
import Sales from './components/Sales';
import SaleDetails from './components/SaleDetails';
import CompletedSales from './components/CompletedSales';
import DueSales from './components/DueSales';
import UserSales from './components/Usersales';
import Team from './components/Team';

const API = import.meta.env.VITE_API_URL;

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/Auth/check-auth`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/AddLead" element={<AddLead />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/lead/:id" element={<Lead />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sale/:id" element={<SaleDetails />} />
          <Route path="/completed-sales" element={<CompletedSales />} />
          <Route path="/due-sales" element={<DueSales />} />
          <Route path="/user-sales" element={<UserSales />} />
          <Route path="/team" element={<Team />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}