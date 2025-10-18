// app.jsx

import React, { useState } from "react"; // 👈 NEW IMPORT
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  // 💥 NEW STATE: Key to forcing re-render after auth change 💥
  const [authKey, setAuthKey] = useState(0); 

  // Function to trigger re-render
  const updateAuthStatus = () => {
    // Incrementing the key forces the App component to update
    setAuthKey(prev => prev + 1);
  };
    
  // isAuthenticated will be re-evaluated whenever authKey changes
  const isAuthenticated = !!localStorage.getItem("JWT");

  return (
    <Routes>
      {/* 1. Login Route: Pass the trigger function */}
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to="/" replace /> 
          : <LoginPage onAuthChange={updateAuthStatus} /> // 👈 PASS THE FUNCTION
      } />
      
      {/* 2. Protected Dashboard Route (Logic is fine) */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <ProfilePage onAuthChange={updateAuthStatus} /> // 👈 PASS THE FUNCTION FOR LOGOUT
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* 3. AUTO-CORRECT / CATCH-ALL ROUTE (Logic is fine) */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? <Navigate to="/" replace />
            : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

export default App;