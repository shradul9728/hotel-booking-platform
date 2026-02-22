import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Hotel, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
              <Hotel size={28} />
              LuxeStay
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors bg-purple-50 px-3 py-1.5 rounded-lg">
                    <ShieldCheck size={20} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <User size={20} />
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
