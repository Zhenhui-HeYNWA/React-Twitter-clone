import { Route, Routes } from 'react-router-dom';
import SignUpPage from './pages/auth/signup/SignUpPage';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/login/LoginPage';
import Sidebar from './components/common/Sidebar';
import RightPanel from './components/common/RightPanel';

function App() {
  return (
    <div className='flex max-w-6xl mx-auto'>
      {/* Common component */}
      <Sidebar />
      <Routes>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/login' element={<LoginPage />}></Route>
        <Route path='/signUp' element={<SignUpPage />}></Route>
      </Routes>
      <RightPanel />
    </div>
  );
}

export default App;
