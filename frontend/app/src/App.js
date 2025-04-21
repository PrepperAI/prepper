import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import BehavioralInterviewLandingPage from "./components/interview-modes/BehavioralInterview/BehavioralInterviewLandingPage";
import BehavioralInterviewSetup from "./components/interview-modes/BehavioralInterview/BehavioralInterviewSetup";
import BehavioralInterviewSession from "./components/interview-modes/BehavioralInterview/BehavioralInterviewSession";
import TechnicalInterviewLandingPage from "./components/interview-modes/TechnicalInterview/TechnicalInterviewLandingPage";
import TechnicalInterviewSetup from "./components/interview-modes/TechnicalInterview/TechnicalInterviewSetup";
import TechnicalInterviewSession from "./components/interview-modes/TechnicalInterview/TechnicalInterviewSession";
import SystemDesignLanding from "./components/SystemDesign/SystemDesignLandingPage";
import SystemDesignSetup from "./components/SystemDesign/SystemDesignSetup";
import SystemDesignSession from "./components/SystemDesign/SystemDesignSession";
import ScheduleInterview from "./components/schedule/ScheduleInterview";
import MyScheduledInterviews from "./components/schedule/MyScheduledInterviews";
import FeedbackList from "./components/feedback/FeedbackList";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <h1>Hello from Prepper 👋</h1>
    //   <Router>
    //     <Toaster
    //       position="top-right"
    //       toastOptions={{
    //         style: {
    //           background: "#1f1f2e",
    //           color: "#f1f5f9",
    //         },
    //         success: {
    //           iconTheme: {
    //             primary: "#10b981",
    //             secondary: "#1f1f2e",
    //           },
    //         },
    //         error: {
    //           iconTheme: {
    //             primary: "#ef4444",
    //             secondary: "#1f1f2e",
    //           },
    //         },
    //         duration: 3000,
    //       }}
    //     />

    //     <Routes>
    //       <Route path="/" element={<LandingPage />} />
    //       <Route path="/login" element={<Login />} />

    //       <Route
    //         path="/dashboard"
    //         element={
    //           <ProtectedRoute>
    //             <Dashboard />
    //           </ProtectedRoute>
    //         }
    //       >
    //         <Route path="home" element={<DashboardHome />} />
    //         <Route
    //           path="behavioral"
    //           element={<BehavioralInterviewLandingPage />}
    //         />
    //         <Route path="technical" element={<TechnicalInterviewLandingPage />} />
    //         <Route path="system-design" element={<SystemDesignLanding />} />
    //         <Route path="schedule" element={<ScheduleInterview />} />
    //         <Route path="my-interviews" element={<MyScheduledInterviews />} />
    //         <Route path="feedback" element={<FeedbackList />} />
    //       </Route>

    //       <Route
    //         path="/interview/behavioral/setup"
    //         element={<BehavioralInterviewSetup />}
    //       />
    //       <Route
    //         path="/interview/behavioral/session"
    //         element={<BehavioralInterviewSession />}
    //       />
    //       <Route
    //         path="/interview/technical/setup"
    //         element={<TechnicalInterviewSetup />}
    //       />
    //       <Route
    //         path="/interview/technical/session"
    //         element={<TechnicalInterviewSession />}
    //       />
    //       <Route
    //         path="/interview/system-design/setup"
    //         element={<SystemDesignSetup />}
    //       />
    //       <Route
    //         path="/interview/system/session"
    //         element={<SystemDesignSession />}
    //       />
    //     </Routes>
    //   </Router>
  );
}

export default App;
