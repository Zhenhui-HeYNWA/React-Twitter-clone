import { MdNightlight, MdSunny } from 'react-icons/md';
import { useTheme } from './ThemeProvider';

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <button
        className='outline-none border-none bg-transparent  items-center'
        onClick={toggleTheme}>
        {theme === 'light' ? (
          <MdSunny className='w-6 h-6 text-secondary dark:text-white  items-center' />
        ) : (
          <MdNightlight className='w-6 h-6 text-secondary dark:text-white  items-center' />
        )}
      </button>
    </>
  );
};

export default ThemeToggler;
