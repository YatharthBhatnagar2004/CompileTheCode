import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MySnippets from "./pages/MySnippets";
import CodeEditorView from "./pages/CodeEditorView";
import Landing from "./pages/Landing";
import CollaborationRoom from "./pages/CollaborationRoom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const isAuthed = () => !!localStorage.getItem("token");

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen aurora-bg" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-snippets"
              element={
                <PrivateRoute>
                  <MySnippets />
                </PrivateRoute>
              }
            />
            <Route
              path="/editor/:snippetId"
              element={
                <PrivateRoute>
                  <CodeEditorView />
                </PrivateRoute>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <PrivateRoute>
                  <CollaborationRoom />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
