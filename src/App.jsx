import { Navigate, Route, Routes } from 'react-router-dom'
import RoleGate from './auth/RoleGate'
import LoginPage from './features/home/LoginPage'

import PatientLayout from './layouts/PatientLayout'
import PatientOverview from './features/home/PatientOverview'
import CareRequestHome from './features/careRequest/CareRequestHome'
import CareRequestDetail from './features/careRequest/CareRequestDetail'
import PatientNurses from './features/nurseMatching/PatientNurses'
import BookingList from './features/booking/BookingList'
import BookingDetail from './features/booking/BookingDetail'
import FamilyContacts from './features/sos/FamilyContacts'
import PatientProfile from './features/home/PatientProfile'

import HospitalLayout from './layouts/HospitalLayout'
import HospitalOverview from './features/hospitalRoster/HospitalOverview'
import NurseTable from './features/hospitalRoster/NurseTable'
import NurseDetail from './features/hospitalRoster/NurseDetail'
import HospitalVerification from './features/hospitalRoster/HospitalVerification'
import HospitalSchedule from './features/hospitalRoster/HospitalSchedule'
import HospitalRequests from './features/hospitalRoster/HospitalRequests'
import NurseOverview from './features/hospitalRoster/NurseOverview'
import NurseRequests from './features/hospitalRoster/NurseRequests'
import NurseSchedule from './features/hospitalRoster/NurseSchedule'
import NurseProfileSelf from './features/hospitalRoster/NurseProfileSelf'
import SosLog from './features/sos/SosLog'
import PricingConfig from './features/pricing/PricingConfig'

import AdminLayout from './layouts/AdminLayout'
import PlatformDashboard from './features/platformAdmin/PlatformDashboard'
import HospitalsTable from './features/platformAdmin/HospitalsTable'
import HospitalForm from './features/platformAdmin/HospitalForm'
import HospitalAccountDetail from './features/platformAdmin/HospitalAccountDetail'
import AccountsTable from './features/platformAdmin/AccountsTable'
import Compliance from './features/platformAdmin/Compliance'
import Settings from './features/platformAdmin/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/patient"
        element={
          <RoleGate roles={['patient']}>
            <PatientLayout />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<PatientOverview />} />
        <Route path="request" element={<CareRequestHome />} />
        <Route path="request/:id" element={<CareRequestDetail />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="nurses" element={<PatientNurses />} />
        <Route path="family" element={<FamilyContacts />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      <Route
        path="/hospital"
        element={
          <RoleGate roles={['hospitalAdmin', 'nurse']}>
            <HospitalLayout />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="admin/overview" replace />} />
        <Route
          path="admin/overview"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <HospitalOverview />
            </RoleGate>
          }
        />
        <Route
          path="admin/roster"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <NurseTable />
            </RoleGate>
          }
        />
        <Route
          path="admin/roster/:id"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <NurseDetail />
            </RoleGate>
          }
        />
        <Route
          path="admin/verification"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <HospitalVerification />
            </RoleGate>
          }
        />
        <Route
          path="admin/schedule"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <HospitalSchedule />
            </RoleGate>
          }
        />
        <Route
          path="admin/requests"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <HospitalRequests />
            </RoleGate>
          }
        />
        <Route
          path="admin/sos-log"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <SosLog />
            </RoleGate>
          }
        />
        <Route
          path="admin/pricing"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <PricingConfig />
            </RoleGate>
          }
        />
        <Route
          path="nurse/overview"
          element={
            <RoleGate roles={['nurse']}>
              <NurseOverview />
            </RoleGate>
          }
        />
        <Route
          path="nurse/requests"
          element={
            <RoleGate roles={['nurse']}>
              <NurseRequests />
            </RoleGate>
          }
        />
        <Route
          path="nurse/schedule"
          element={
            <RoleGate roles={['nurse']}>
              <NurseSchedule />
            </RoleGate>
          }
        />
        <Route
          path="nurse/profile"
          element={
            <RoleGate roles={['nurse']}>
              <NurseProfileSelf />
            </RoleGate>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleGate roles={['platformAdmin']}>
            <AdminLayout />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<PlatformDashboard />} />
        <Route path="hospitals" element={<HospitalsTable />} />
        <Route path="hospitals/new" element={<HospitalForm />} />
        <Route path="hospitals/:id" element={<HospitalAccountDetail />} />
        <Route path="accounts" element={<AccountsTable />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
