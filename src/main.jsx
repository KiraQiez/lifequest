import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Homepage from "./pages/Homepage.jsx";
import Group from "./pages/Group.jsx";
import Expense from "./pages/Expense.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Profile from "./pages/profile.jsx";
import Statistic from "./pages/Statistic.jsx";
import Transactions from "./pages/Transactions.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- Public routes --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Protected routes --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/group" element={<Group />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/statistic" element={<Statistic />} />
          <Route path="/profile" element={<Profile />} />
           <Route path="/transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
