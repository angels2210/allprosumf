/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Offers from './pages/Offers';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import ClientRegister from './pages/ClientRegister';
import Footer from './components/Footer';
import SupportChat from './components/SupportChat';

import { Toaster } from 'react-hot-toast';
import { ClientProvider } from './context/ClientContext';

export default function App() {
  return (
    <SettingsProvider>
      <ClientProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-[#F4F4F4] flex flex-col pb-20 md:pb-0">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/login" element={<ClientLogin />} />
              <Route path="/register" element={<ClientRegister />} />
              <Route path="/profile" element={<ClientDashboard />} />
              <Route path="*" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/offers" element={<Offers />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                    </Routes>
                  </main>
                  <Footer />
                  <SupportChat />
                </>
              } />
            </Routes>
          </div>
        </Router>
        </CartProvider>
      </ClientProvider>
    </SettingsProvider>
  );
}
