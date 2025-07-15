import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import { ChatProvider } from "./contexts/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";

import { BrowserRouter as Router } from "react-router-dom"
import { MatchaRoutesDefault, MatchaRoutes } from "./routes/MatchaRoutes"
import { UserContext } from './context/UserContext';
import { useContext } from 'react';
import Menu from './routes/components/Menu';

function App() {
	// const context = useContext(UserContext);
	// if (!context?.user)
	// 	return (
	// 	 	<Router>
	// 	 		<MatchaRoutesDefault />
	// 	 	</Router>
	// 	)
	// return (
	// 	<Router>
	// 		<Menu />
	// 		<MatchaRoutes />
	// 	</Router>
	// )

	return (
		// AuthProvider 
		<>
		 <TooltipProvider>
			<Toaster />
			<Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              {/* <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/confirm-email" element={<EmailConfirmation />} /> */}
              {/*  */}
              {/* First Connection Route (logged in but profile incomplete) */}
              {/* <Route path="/first-connection" element={
                <ProtectedRoute requireProfileComplete={false}>
                  <FirstConnection />
                </ProtectedRoute> */}
              {/* } /> */}
              
              {/* Protected Routes (require completed profile) */}
              {/* <Route path="/home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/profile/edit" element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              } />
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <PublicProfile />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatListPage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:userId" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } /> */}
              
              {/* Legacy redirects
              <Route path="/browse" element={<Navigate to="/home" replace />} />
              <Route path="/profile" element={<Navigate to="/profile/edit" replace />} />
               */}
              {/* Catch-all route */}
              {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
          </BrowserRouter>
		  </TooltipProvider>
		</>
	)
}

export default App
