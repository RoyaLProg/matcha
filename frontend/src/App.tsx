import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import UserProvider from "./contexts/UserContext";
import WebSocketProvider from "./contexts/WebSocketContext";
import ChatProvider from "./contexts/ChatContext";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EmailConfirmation from "./pages/EmailConfirmation";
import FirstConnection from "./pages/FirstConnection";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";
import SearchPage from "./pages/SearchPage";
import EditProfile from "./pages/EditProfile";
import PublicProfile from "./pages/PublicProfile";
import AccountPage from "./pages/AccountPage";
import ChatListPage from "./pages/ChatListPage";
import ChatPage from "./pages/ChatPage";
import CallProvider from "./contexts/CallContext";
import CallModal from "./components/CallModal";
import EventsPage from "./pages/EventsPage";


const queryClient = new QueryClient();

function App() {
	return (
    <QueryClientProvider client={queryClient}>
		<AuthProvider>
      <UserProvider>
        <WebSocketProvider>
          <CallProvider>
          <ChatProvider>
		 <TooltipProvider>
			<Toaster />
			<Sonner />
            <CallModal />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
  <RedirectIfAuthenticated>
    <Auth />
  </RedirectIfAuthenticated>
} />
              <Route path="/reset-password/:token" element={<RedirectIfAuthenticated><ResetPassword /></RedirectIfAuthenticated>} />
              <Route path="/reset-password" element={<RedirectIfAuthenticated><ResetPassword /></RedirectIfAuthenticated>} />
              <Route path="/confirm-email" element={<RedirectIfAuthenticated><EmailConfirmation /></RedirectIfAuthenticated>} />

              <Route path="/first-connection" element={
                (console.log("routing vers /first-connection"),
                <ProtectedRoute requireProfileComplete={false}>
                  <FirstConnection />
                </ProtectedRoute>)
              } />
              
              <Route path="/home" element={
                (console.log("routing vers /home"),
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>)
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatListPage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:id" element={
                <ProtectedRoute>
                  <ChatPage />
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
              <Route path="/events" element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              } />
              
              
            </Routes>
          </BrowserRouter>
		  </TooltipProvider>
          </ChatProvider>
          </CallProvider>
        </WebSocketProvider>
      </UserProvider>
		</AuthProvider>
    </QueryClientProvider>
	)
}

export default App
