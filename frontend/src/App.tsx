import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectValuePage from "./pages/ProjectValuePage";
import ProjectDesignPage from "./pages/ProjectDesignPage";
import ProjectDirectionsPage from "./pages/ProjectDirectionsPage";
import ProjectPreviewPage from "./pages/ProjectPreviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/projects/new"
          element={<CreateProjectPage />}
        />

        <Route
          path="/projects/new/details"
          element={<ProjectDetailsPage />}
        />

        <Route
          path="/projects/new/value"
          element={<ProjectValuePage />}
        />

        <Route
          path="/projects/new/design"
          element={<ProjectDesignPage />}
        />
        <Route
  path="/projects/new/directions"
  element={<ProjectDirectionsPage />}
/>
<Route
  path="/projects/new/preview"
  element={<ProjectPreviewPage />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;