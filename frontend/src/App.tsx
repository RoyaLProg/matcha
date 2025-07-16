import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EmailConfirmation from "./pages/EmailConfirmation";
import FirstConnection from "./pages/FirstConnection";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";


const queryClient = new QueryClient();

function App() {

	return (
		// AuthProvider 
    <QueryClientProvider client={queryClient}>
		<AuthProvider>
      <ChatProvider>
		 <TooltipProvider>
			<Toaster />
			<Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
  <RedirectIfAuthenticated>
    <Auth />
  </RedirectIfAuthenticated>
} />
              <Route path="/reset-password" element={<RedirectIfAuthenticated><ResetPassword /></RedirectIfAuthenticated>} />
              <Route path="/confirm-email" element={<RedirectIfAuthenticated><EmailConfirmation /></RedirectIfAuthenticated>} />

              <Route path="/first-connection" element={
                (console.log("routing vers /first-connection"),
                <ProtectedRoute requireProfileComplete={false}>
                  <FirstConnection />
                </ProtectedRoute>)
              } />
              
              {/* Protected Routes (require completed profile) */}
              <Route path="/home" element={
                (console.log("routing vers /home"),
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>)
              } />
               {/*<Route path="/search" element={
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
      </ChatProvider>
		</AuthProvider>
    </QueryClientProvider>
	)
}

export default App
