import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import DataTable from './DataTable';
import DocumentForm from './DocumentForm';
import UserList from './UserList';
import ContactList from './ContactList';
import DeviceList from './DeviceList';
import FolderList from './FolderList';
import SettingsList from './SettingsList';
import TraceabilityList from './TraceabilityList';
import PlansList from './PlansList';
import GeoportalList from './GeoportalList';
import ProjectsList from './ProjectsList';
import DynamicFormsList from './DynamicFormsList';
import AnswerEngine from './AnswerEngine';
import ReportsList from './ReportsList';
import Login from './Login';
import RolesList from './RolesList';
import PermitsList from './PermitsList';
import TasksList from './TasksList';
import EnrolmentList from './EnrolmentList';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        {/* Rutas Hijas que se renderizan dentro del <Outlet /> del Layout */}
        <Route index element={<Dashboard />} />
        <Route path="drive" element={<FolderList />} />
        <Route path="users" element={<UserList />} />
        <Route path="roles" element={<RolesList />} />
        <Route path="permits" element={<PermitsList />} />
        <Route path="contacts" element={<ContactList />} />
        <Route path="devices" element={<DeviceList />} />
        <Route path="documents" element={<DataTable />} />
        <Route path="new-document" element={<DocumentForm />} />
        <Route path="traceability" element={<TraceabilityList />} />
        <Route path="plans" element={<PlansList />} />
        <Route path="geoportal" element={<GeoportalList />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="tasks" element={<TasksList />} />
        <Route path="enroll" element={<EnrolmentList />} />
        <Route path="forms" element={<DynamicFormsList />} />
        <Route path="forms/answer/:formId" element={<AnswerEngine />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="settings" element={<SettingsList />} />
      </Route>
    </Routes>
  );
}

export default App;
