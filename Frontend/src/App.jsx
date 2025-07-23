import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Signup from './components/Signup';
import Login from './components/Login';
import AddLead from './components/AddLead';
import Leads from './components/Leads';
import Lead from './components/Lead';
import Sales from './components/Sales';
import SaleDetails from './components/SaleDetails'; // Import SaleDetails
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Standalone routes without Navbar */}
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        {/* Routes under Navbar */}
        <Route element={<Layout />}>
          <Route path="/AddLead" element={<AddLead />} />
          <Route path="/leads" element={<Leads />} />  
          <Route path="/lead/:id" element={<Lead />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sale/:id" element={<SaleDetails />} /> {/* Add SaleDetails route */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}