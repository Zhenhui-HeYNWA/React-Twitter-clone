import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './components/common/LoadingSpinner';
import Sidebar from './components/common/Sidebar';
import MobileBar from './components/common/MobileBar'; // 导入 MobileBar
import RightPanel from './components/common/RightPanel';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/login/LoginPage';
import SignUpPage from './pages/auth/signup/SignUpPage';
import NotificationPage from './pages/notification/NotificationPage';
import ProfilePage from './pages/profile/ProfilePage';
import FollowPage from './pages/follow/FollowPage';
import { Toaster } from 'react-hot-toast';
import useMediaQuery from './hooks/useMediaQuery'; // 导入 useMediaQuery

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.error) return null;
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    retry: false,
  });

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isLoading) {
    return (
      <div className='h-screen flex justify-center items-center'>
        <LoadingSpinner size='large' />
      </div>
    );
  }

  return (
    <>
      <div className='flex max-w-6xl mx-auto bg-gray-100 dark:bg-secondary text-black dark:text-white pb-8'>
        {authUser && !isMobile && <Sidebar />}{' '}
        {/* 在非手机屏幕下显示 Sidebar */}
        <Routes>
          <Route
            path='/'
            element={authUser ? <HomePage /> : <Navigate to='/login' />}
          />
          <Route
            path='/login'
            element={!authUser ? <LoginPage /> : <Navigate to='/' />}
          />

          <Route
            path='/signUp'
            element={!authUser ? <SignUpPage /> : <Navigate to='/' />}
          />
          <Route
            path='/notifications'
            element={
              authUser ? (
                <NotificationPage authUser={authUser} />
              ) : (
                <Navigate to='/login' />
              )
            }
          />

          <Route
            path='/profile/:username'
            element={authUser ? <ProfilePage /> : <Navigate to='/login' />}
          />
          <Route
            path='/follow/:username'
            element={authUser ? <FollowPage /> : <Navigate to='/login' />}
          />
        </Routes>
        {authUser && <RightPanel />}
        {authUser && isMobile && <MobileBar authUser={authUser} />}{' '}
        {/* 在手机屏幕下显示 MobileBar */}
      </div>
      <div>
        <Toaster />
      </div>
    </>
  );
}

export default App;
