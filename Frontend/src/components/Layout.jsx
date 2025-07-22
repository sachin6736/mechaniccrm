import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="md:ml-20 mt-16 md:mt-0 flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;