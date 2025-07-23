import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Signup from './components/Signup';
import Login from './components/Login';
import AddLead from './components/AddLead';
import Leads from './components/Leads';
import Lead from './components/Lead';
import Sales from './components/Sales';
import SaleDetails from './components/SaleDetails';
import CompletedSales from './components/CompletedSales';
import Team from './components/Team';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Standalone routes without Navbar */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Routes under Navbar */}
        <Route element={<Layout />}>
          <Route path="/AddLead" element={<AddLead />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/lead/:id" element={<Lead />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sale/:id" element={<SaleDetails />} />
          <Route path="/completed-sales" element={<CompletedSales />} />
          <Route path="/team" element={<Team />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}