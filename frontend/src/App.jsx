import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Insights from './components/Insights'
import Marketplace from './components/Marketplace'
import CTA from './components/CTA'
import Footer from './components/Footer'
import FarmerDashboard from './components/FarmerDashboard'
import BuyerMarketplace from './components/BuyerMarketplace'
import LogisticsDashboard from './components/LogisticsDashboard'
import MarketIntelligence from './components/MarketIntelligence'
import Login from './components/Login'
import Register from './components/Register'
import FpoDashboard from './components/FpoDashboard'
import PurchaseRequests from './components/PurchaseRequests'
import { ListingsProvider } from './context/ListingsContext'
import { AuthProvider } from './context/AuthContext'

import CropOpportunity from './components/CropOpportunity'
import VoiceAssistant from './components/VoiceAssistant'

function Homepage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Insights />
        <Marketplace />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

function CropOpportunityPage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <CropOpportunity />
      </main>
      <Footer />
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <FarmerDashboard />
      </main>
    </div>
  )
}

function FpoDashboardPage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <FpoDashboard />
      </main>
    </div>
  )
}

function MarketplacePage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <BuyerMarketplace />
      </main>
    </div>
  )
}

function LogisticsPage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <LogisticsDashboard />
      </main>
    </div>
  )
}

function MarketIntelligencePage() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <MarketIntelligence />
      </main>
    </div>
  )
}

function PurchaseRequestsPage({ mode }) {
  return (
    <div className="app-root">
      <Navbar />
      <main><PurchaseRequests mode={mode} /></main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ListingsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/crop-opportunity" element={<CropOpportunityPage />} />
            <Route path="/farmer-dashboard" element={<DashboardPage />} />
            <Route path="/fpo-dashboard" element={<FpoDashboardPage />} />
            <Route path="/buyer-requests" element={<PurchaseRequestsPage mode="buyer" />} />
            <Route path="/farmer-requests" element={<PurchaseRequestsPage mode="farmer" />} />
            <Route path="/fpo-requests" element={<PurchaseRequestsPage mode="fpo" />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/logistics" element={<LogisticsPage />} />
            <Route path="/market-intelligence" element={<MarketIntelligencePage />} />
            <Route path="*" element={<Homepage />} />
          </Routes>
          <VoiceAssistant />
        </ListingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
