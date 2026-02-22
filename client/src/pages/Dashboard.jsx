import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, MapPin, BedDouble, XCircle, CheckCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchProfile();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`/api/bookings/user/${user.email}`);
      setBookings(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/profile/${user.email}`);
      setProfile({ name: res.data.name });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.delete(`/api/bookings/${id}`);
      fetchBookings(); // Refresh list
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/profile/${user.email}`, { name: profile.name });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center text-2xl text-gray-500">Please login to view your dashboard.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Dashboard</h1>
          <p className="text-lg text-gray-500 mt-2">Manage your bookings and profile settings.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-full text-blue-600 mb-4 shadow-inner">
                  <User size={48} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Guest User'}</h2>
                  <p className="text-gray-500 font-medium mt-1">{user.email}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {user.role || 'User'}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <motion.form 
                  onSubmit={handleUpdateProfile} 
                  className="space-y-5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md hover:shadow-lg">Save Changes</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-bold">Cancel</button>
                  </div>
                </motion.form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-xl text-gray-900 font-bold">{profile.name || user.name || 'Not set'}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 border-2 border-blue-100 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all font-bold"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Bookings Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3 border-b pb-4">
                <Calendar size={32} className="text-blue-600" />
                My Bookings
              </h2>

              {bookings.length === 0 ? (
                <motion.div 
                  className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <BedDouble size={64} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-xl font-medium">You have no bookings yet.</p>
                  <p className="text-gray-400 mt-2">Start exploring hotels to plan your next trip!</p>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {bookings.map((booking, index) => (
                    <motion.div 
                      key={booking.id} 
                      className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${booking.status === 'cancelled' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-xl'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Hotel Image (if available) */}
                        {booking.hotel_image && (
                          <div className="md:w-1/3 h-48 md:h-auto relative">
                            <img src={booking.hotel_image} alt={booking.hotel_name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden"></div>
                          </div>
                        )}
                        
                        <div className={`p-6 flex-1 ${!booking.hotel_image ? 'w-full' : ''}`}>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">{booking.hotel_name}</h3>
                              <p className="text-gray-500 flex items-center gap-2 mt-1 font-medium">
                                <MapPin size={18} className="text-blue-400" /> {booking.hotel_location}
                              </p>
                            </div>
                            <div className={`mt-3 md:mt-0 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                              {booking.status === 'cancelled' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Room Type</p>
                              <p className="text-gray-900 font-bold">{booking.room_type}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dates</p>
                              <p className="text-gray-900 font-bold">
                                {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Price</p>
                              <p className="text-blue-600 font-extrabold text-xl">${booking.total_price}</p>
                            </div>
                          </div>

                          {booking.status !== 'cancelled' && (
                            <div className="flex justify-end">
                              <button 
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-red-600 hover:text-red-800 font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <XCircle size={18} /> Cancel Booking
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
