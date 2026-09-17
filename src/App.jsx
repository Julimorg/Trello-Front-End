import { Navigate, Route, Routes } from 'react-router-dom'
import RoleGate from './auth/RoleGate'
import LoginPage from './features/home/LoginPage'

import PatientLayout from './layouts/PatientLayout'
import CareRequestList from './features/careRequest/CareRequestList'
import CareRequestForm from './features/careRequest/CareRequestForm'
import CareRequestDetail from './features/careRequest/CareRequestDetail'
import MatchList from './features/nurseMatching/MatchList'
import BookingForm from './features/booking/BookingForm'
import BookingList from './features/booking/BookingList'
import BookingDetail from './features/booking/BookingDetail'
import FamilyContacts from './features/sos/FamilyContacts'

import HospitalLayout from './layouts/HospitalLayout'
import RosterDashboard from './features/hospitalRoster/RosterDashboard'
import NurseTable from './features/hospitalRoster/NurseTable'
import NurseForm from './features/hospitalRoster/NurseForm'
import NurseDetail from './features/hospitalRoster/NurseDetail'
import CannotPerformInbox from './features/hospitalRoster/CannotPerformInbox'
import NurseSchedule from './features/hospitalRoster/NurseSchedule'
import NurseProfileSelf from './features/hospitalRoster/NurseProfileSelf'
import SosLog from './features/sos/SosLog'
import PricingConfig from './features/pricing/PricingConfig'

import AdminLayout from './layouts/AdminLayout'
import PlatformDashboard from './features/platformAdmin/PlatformDashboard'
import HospitalsTable from './features/platformAdmin/HospitalsTable'
import HospitalForm from './features/platformAdmin/HospitalForm'
import HospitalAccountDetail from './features/platformAdmin/HospitalAccountDetail'
import NursesOversight from './features/platformAdmin/NursesOversight'
import PatientsOversight from './features/platformAdmin/PatientsOversight'

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
        <Route index element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<CareRequestList />} />
        <Route path="requests/new" element={<CareRequestForm />} />
        <Route path="requests/:id" element={<CareRequestDetail />} />
        <Route path="requests/:id/matches" element={<MatchList />} />
        <Route path="requests/:id/book/:nurseId" element={<BookingForm />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="family" element={<FamilyContacts />} />
      </Route>

      <Route
        path="/hospital"
        element={
          <RoleGate roles={['hospitalAdmin', 'nurse']}>
            <HospitalLayout />
          </RoleGate>
        }
      >
        <Route
          index
          element={<Navigate to="admin/dashboard" replace />}
        />
        <Route
          path="admin/dashboard"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <RosterDashboard />
            </RoleGate>
          }
        />
        <Route
          path="admin/nurses"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <NurseTable />
            </RoleGate>
          }
        />
        <Route
          path="admin/nurses/new"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <NurseForm />
            </RoleGate>
          }
        />
        <Route
          path="admin/nurses/:id"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <NurseDetail />
            </RoleGate>
          }
        />
        <Route
          path="admin/cannot-perform"
          element={
            <RoleGate roles={['hospitalAdmin']}>
              <CannotPerformInbox />
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
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PlatformDashboard />} />
        <Route path="hospitals" element={<HospitalsTable />} />
        <Route path="hospitals/new" element={<HospitalForm />} />
        <Route path="hospitals/:id" element={<HospitalAccountDetail />} />
        <Route path="nurses" element={<NursesOversight />} />
        <Route path="patients" element={<PatientsOversight />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
