import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FormProvider } from './context/FormContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import CreateForm from './pages/CreateForm';
import ManageForms from './pages/ManageForms';
import BranchPatients from './pages/BranchPatients';
import Analytics from './pages/Analytics';
import ViewForm from './pages/ViewForm';
import EditForm from './pages/EditForm';
import ManageDoctors from './pages/ManageDoctors';
import DicomViewerWithMPR from './pages/DicomViewerWithMPR';
import './App.css';
import './styles/responsive.css';

const AppContent = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CreateForm />} />
        <Route path="/create" element={<CreateForm />} />
        <Route path="/manage" element={<ManageForms />} />
        <Route path="/doctors" element={<ManageDoctors />} />
        <Route path="/patients" element={<BranchPatients />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/view/:id" element={<ViewForm />} />
        <Route path="/edit/:id" element={<EditForm />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/viewer/:caseId" element={<DicomViewerWithMPR />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </FormProvider>
    </AuthProvider>
  );
}

export default App;
