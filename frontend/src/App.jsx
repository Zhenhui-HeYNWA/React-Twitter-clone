import { Route, Routes } from 'react-router-dom';
import SignUpPage from './pages/auth/signup/SignUpPage';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/login/LoginPage';

function App() {
  return (
    <div className='flex max-w-6xl mx-auto'>
      <Routes>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/login' element={<LoginPage />}></Route>
        <Route path='/signUp' element={<SignUpPage />}></Route>
      </Routes>
    </div>
  );
}

export default App;
