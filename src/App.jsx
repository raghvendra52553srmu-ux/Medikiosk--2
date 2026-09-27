import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/ui/Toast";
import { StaffGate } from "@/components/auth/StaffGate";

import RoleSelect from "@/pages/RoleSelect";
import LandingPage from "@/pages/LandingPage";

import PatientHome from "@/pages/patient/PatientHome";
import ConsentPage from "@/pages/patient/ConsentPage";
import LanguagePage from "@/pages/patient/LanguagePage";
import RegistrationPage from "@/pages/patient/RegistrationPage";
import ProblemTriagePage from "@/pages/patient/ProblemTriagePage";
import LocationPage from "@/pages/patient/LocationPage";
import HospitalsPage from "@/pages/patient/HospitalsPage";
import HospitalDetailPage from "@/pages/patient/HospitalDetailPage";
import DepartmentPage from "@/pages/patient/DepartmentPage";
import DoctorDetailPage from "@/pages/patient/DoctorDetailPage";
import RelatedDoctorsPage from "@/pages/patient/RelatedDoctorsPage";
import TokenPage from "@/pages/patient/TokenPage";
import HistoryPage from "@/pages/patient/HistoryPage";
import DocumentsPage from "@/pages/patient/DocumentsPage";
import ReviewPage from "@/pages/patient/ReviewPage";
import QueuePage from "@/pages/patient/QueuePage";

import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorQueue from "@/pages/doctor/DoctorQueue";
import PatientDetail from "@/pages/doctor/PatientDetail";
import DoctorSettings from "@/pages/doctor/DoctorSettings";

import AdminDashboard from "@/pages/admin/AdminDashboard";

function DoctorRoute({ children }) {
  return <StaffGate role="doctor">{children}</StaffGate>;
}

function AdminRoute({ children }) {
  return <StaffGate role="admin">{children}</StaffGate>;
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/kiosk" element={<RoleSelect />} />

            {/* Patient kiosk — open, no PIN */}
            <Route path="/patient" element={<PatientHome />} />
            <Route path="/patient/consent" element={<ConsentPage />} />
            <Route path="/patient/language" element={<LanguagePage />} />
            <Route path="/patient/registration" element={<RegistrationPage />} />
            <Route path="/patient/triage" element={<ProblemTriagePage />} />
            <Route path="/patient/problem" element={<ProblemTriagePage />} />
            <Route path="/patient/location" element={<LocationPage />} />
            <Route path="/patient/doctors" element={<RelatedDoctorsPage />} />
            <Route path="/patient/related-doctors" element={<RelatedDoctorsPage />} />
            <Route path="/patient/hospitals" element={<HospitalsPage />} />
            <Route path="/patient/hospital/:hospitalId" element={<HospitalDetailPage />} />
            <Route path="/patient/department/:hospitalId" element={<DepartmentPage />} />
            <Route path="/patient/doctor/:doctorId" element={<DoctorDetailPage />} />
            <Route path="/patient/token/:tokenId" element={<TokenPage />} />
            <Route path="/patient/history" element={<HistoryPage />} />
            <Route path="/patient/documents" element={<DocumentsPage />} />
            <Route path="/patient/review" element={<ReviewPage />} />
            <Route path="/patient/queue/:tokenId" element={<QueuePage />} />

            {/* Doctor — PIN required */}
            <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="/doctor/dashboard" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
            <Route path="/doctor/queue" element={<DoctorRoute><DoctorQueue /></DoctorRoute>} />
            <Route path="/doctor/patient/:patientId" element={<DoctorRoute><PatientDetail /></DoctorRoute>} />
            <Route path="/doctor/settings" element={<DoctorRoute><DoctorSettings /></DoctorRoute>} />

            {/* Admin — PIN required */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AppProvider>
    </HashRouter>
);
}
