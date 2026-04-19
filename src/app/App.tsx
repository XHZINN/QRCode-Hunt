import { BrowserRouter, Routes, Route } from 'react-router';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { Toaster } from './components/ui/sonner';
import { Home } from './components/Home';
import { Ranking } from './components/Ranking';
import { Profile } from './components/Profile';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50">
          <AppSidebar />

          <SidebarInset className="flex-1">
            <Toaster position="top-center" richColors />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
