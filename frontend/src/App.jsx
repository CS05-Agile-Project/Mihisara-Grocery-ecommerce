
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import CR from "./Pages/client/CR.jsx";
import AdminPage from './Pages/admin/adminPage.jsx';
import LoginPage from "./Pages/login.jsx";
import RegisterPage from "./Pages/register.jsx";
import ForgetPasswordPage from "./Pages/forgetPassword.jsx";
import {Toaster} from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import {GoogleOAuthProvider} from "@react-oauth/google";


function App() {
  return (
      <GoogleOAuthProvider clientId="932522795625-37a6btc2f1i50g4eva3eg69f1nft5dsi.apps.googleusercontent.com">
    <BrowserRouter>
      {/* 👇 ensures every route change scrolls to top */}
      <ScrollToTop />

      <div>
          <Toaster
              position="top-center"
              toastOptions={{
                  // Default toast styles
                  style: {
                      background: "#F0FDF4", // Light green background for success
                      color: "#064E3B", // Dark green text for success
                      padding: "10px", // Padding inside the toast
                      borderRadius: "15px", // Rounded corners
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Box shadow for the toast
                      fontFamily: "Poppins, sans-serif", // Use Poppins font
                      fontSize: "16px", // Font size
                  },
                  // Success toast style (light green background and dark green text)
                  success: {
                      duration: 3000,
                      style: {
                          background: "#D1FAE5", // Light green background
                          color: "#065F46", // Dark green text
                      },
                  },
                  // Error toast style (light red background and dark red text)
                  error: {
                      duration: 4000,
                      style: {
                          background: "#FEE2E2", // Light red background
                          color: "#B91C1C", // Dark red text
                      },
                  },
              }}
          />
        <Routes>
          {/* Client routes */}
          <Route path="/*" element={<CR />} />
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
          </GoogleOAuthProvider>
  );
}

export default App
