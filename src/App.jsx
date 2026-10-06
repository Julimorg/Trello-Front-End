import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RoleGate from './auth/RoleGate'
import LoginPage from './features/home/LoginPage'

// Each portal is code-split so a role only downloads its own UI libraries
// (patient app: MUI + MUI X + animejs).

const PatientLayout = lazy(() => import('./layouts/PatientLayout'))
const PatientOverview = lazy(() => import('./features/home/PatientOverview'))
const CareRequestHome = lazy(() => import('./features/careRequest/CareRequestHome'))
const CareRequestDetail = lazy(() => import('./features/careRequest/CareRequestDetail'))
const PatientNurses = lazy(() => import('./features/nurseMatching/PatientNurses'))
const PatientNurseDetail = lazy(() => import('./features/nurseMatching/PatientNurseDetail'))
const BookingList = lazy(() => import('./features/booking/BookingList'))
const BookingDetail = lazy(() => import('./features/booking/BookingDetail'))
const FamilyContacts = lazy(() => import('./features/sos/FamilyContacts'))
const PatientProfile = lazy(() => import('./features/home/PatientProfile'))
const FamilyInviteAccept = lazy(() => import('./features/sos/FamilyInviteAccept'))

const HospitalLayout = lazy(() => import('./layouts/HospitalLayout'))
const HospitalOverview = lazy(() => import('./features/hospitalRoster/HospitalOverview'))
const NurseTable = lazy(() => import('./features/hospitalRoster/NurseTable'))
const NurseDetail = lazy(() => import('./features/hospitalRoster/NurseDetail'))
const HospitalVerification = lazy(() => import('./features/hospitalRoster/HospitalVerification'))
const HospitalSchedule = lazy(() => import('./features/hospitalRoster/HospitalSchedule'))
const HospitalRequests = lazy(() => import('./features/hospitalRoster/HospitalRequests'))
const NurseOverview = lazy(() => import('./features/nurse/NurseOverview'))
const NurseRequests = lazy(() => import('./features/nurse/NurseRequests'))
const NurseSchedule = lazy(() => import('./features/nurse/NurseSchedule'))
const NurseProfileSelf = lazy(() => import('./features/nurse/NurseProfile'))
const NurseSessionDetail = lazy(() => import('./features/nurse/NurseSessionDetail'))
const SosLog = lazy(() => import('./features/sos/SosLog'))
const PricingConfig = lazy(() => import('./features/pricing/PricingConfig'))

const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const PlatformDashboard = lazy(() => import('./features/platformAdmin/PlatformDashboard'))
const HospitalsTable = lazy(() => import('./features/platformAdmin/HospitalsTable'))
const HospitalForm = lazy(() => import('./features/platformAdmin/HospitalForm'))
const HospitalAccountDetail = lazy(() => import('./features/platformAdmin/HospitalAccountDetail'))
const AccountsTable = lazy(() => import('./features/platformAdmin/AccountsTable'))
const Compliance = lazy(() => import('./features/platformAdmin/Compliance'))
const Settings = lazy(() => import('./features/platformAdmin/Settings'))

function App() {
  return (
    <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* Public: opened by a relative scanning the patient's QR invite. */}
        <Route path="/family-invite" element={<FamilyInviteAccept />} />
        <Route path="/family-invite/:code" element={<FamilyInviteAccept />} />

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
          <Route path="nurses/:id" element={<PatientNurseDetail />} />
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
            path="nurse/sessions/:sessionId"
            element={
              <RoleGate roles={['nurse']}>
                <NurseSessionDetail />
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
    </Suspense>
  )
}

export default App
