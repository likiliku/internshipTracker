import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Shell } from './layouts/Shell';

import Dashboard from './pages/Dashboard';
import InternshipSearch from './pages/InternshipSearch';
import InternshipDetails from './pages/InternshipDetails';
import MockInterview from './pages/MockInterview';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Applications } from './pages/Applications';
import { Recommendations } from './pages/Recommendations';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';

import { AdminShell } from './layouts/AdminShell';
import { AdminStudents } from './pages/AdminStudents';
import { AdminStudentDetail } from './pages/AdminStudentDetail';
import { AdminInternships } from './pages/AdminInternships';

import { CompanyShell } from './layouts/CompanyShell';
import CompanyDashboard from './pages/CompanyDashboard';
import { CompanyInternshipForm } from './pages/CompanyInternshipForm';
import { CompanyApplicants } from './pages/CompanyApplicants';

function App() {
  const { user } = useAuth();
  
  if (user) {
    if (user.role === 'ADMIN') {
      return (
        <BrowserRouter>
          <AdminShell>
            <Routes>
              {/* Note: /admin/dashboard exists in backend but no frontend page was requested yet, so I'll redirect to students for now, or just leave a placeholder */}
              <Route path="/admin/dashboard" element={<Navigate to="/admin/students" />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
              <Route path="/admin/internships" element={<AdminInternships />} />
              <Route path="*" element={<Navigate to="/admin/students" />} />
            </Routes>
          </AdminShell>
        </BrowserRouter>
      );
    }
    
    if (user.role === 'COMPANY') {
      return (
        <BrowserRouter>
          <CompanyShell>
            <Routes>
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="/company/internships/new" element={<CompanyInternshipForm />} />
              <Route path="/company/internships/:id/edit" element={<CompanyInternshipForm />} />
              <Route path="/company/internships/:id/applicants" element={<CompanyApplicants />} />
              <Route path="*" element={<Navigate to="/company/dashboard" />} />
            </Routes>
          </CompanyShell>
        </BrowserRouter>
      );
    }

    // Default to Student
    return (
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/student/dashboard" element={<Dashboard />} />
            <Route path="/internships" element={<InternshipSearch />} />
            <Route path="/internships/:id" element={<InternshipDetails />} />
            <Route path="/student/applications" element={<Applications />} />
            <Route path="/student/recommendations" element={<Recommendations />} />
            <Route path="/student/profile" element={<Profile />} />
            <Route path="/student/notifications" element={<Notifications />} />
            <Route path="/student/interview/:id" element={<MockInterview />} />
            <Route path="*" element={<Navigate to="/student/dashboard" />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

createRoot(document.getElementById('root')!).render(<RootApp />);
