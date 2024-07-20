import { Navigate, Route, Routes } from 'react-router-dom';
import SignUpPage from './pages/auth/signup/SignUpPage';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/login/LoginPage';
import Sidebar from './components/common/Sidebar';
import FollowPage from './pages/follow/FollowPage';
import RightPanel from './components/common/RightPanel';
import NotificationPage from './pages/notification/NotificationPage';

import ProfilePage from './pages/profile/ProfilePage';

import { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.error) return null;
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        console.log('Auth User:', data);
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    retry: false,
  });
  if (isLoading) {
    return (
      <div className='h-screen flex justify-center items-center '>
        <LoadingSpinner size='large' />
      </div>
    );
  }
  console.log('Auth user:', authUser);
  return (
    <div className='flex max-w-6xl mx-auto'>
      {/* Common component */}
      <Sidebar />
      <Routes>
        <Route
          path='/'
          element={authUser ? <HomePage /> : <Navigate to='/login' />}></Route>
        <Route
          path='/login'
          element={!authUser ? <LoginPage /> : <Navigate to='/' />}></Route>
        <Route
          path='/signUp'
          element={!authUser ? <SignUpPage /> : <Navigate to='/' />}></Route>
        <Route
          path='/notifications'
          element={
            authUser ? <NotificationPage /> : <Navigate to='/login' />
          }></Route>
        <Route
          path='/profile/:username'
          element={
            authUser ? <ProfilePage /> : <Navigate to='/login' />
          }></Route>
        <Route
          path='/follow'
          element={
            authUser ? <FollowPage /> : <Navigate to='/login' />
          }></Route>
      </Routes>

      <RightPanel />
      <Toaster />
    </div>
  );
}

export default App;
