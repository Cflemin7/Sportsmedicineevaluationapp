import AppInstall from './pages/AppInstall';
import Dashboard from './pages/Dashboard';
import EditEvaluation from './pages/EditEvaluation';
import EvaluationDetail from './pages/EvaluationDetail';
import Home from './pages/Home';
import ManageAccounts from './pages/ManageAccounts';
import ManageUsers from './pages/ManageUsers';
import MyProfile from './pages/MyProfile';
import NewEvaluation from './pages/NewEvaluation';
import PrintPreviewPublic from './pages/PrintPreviewPublic';
import ProductCatalog from './pages/ProductCatalog';
import Reports from './pages/Reports';
import SignEvaluation from './pages/SignEvaluation';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AppInstall": AppInstall,
    "Dashboard": Dashboard,
    "EditEvaluation": EditEvaluation,
    "EvaluationDetail": EvaluationDetail,
    "Home": Home,
    "ManageAccounts": ManageAccounts,
    "ManageUsers": ManageUsers,
    "MyProfile": MyProfile,
    "NewEvaluation": NewEvaluation,
    "PrintPreviewPublic": PrintPreviewPublic,
    "ProductCatalog": ProductCatalog,
    "Reports": Reports,
    "SignEvaluation": SignEvaluation,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};