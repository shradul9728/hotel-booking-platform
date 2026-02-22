import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Hotel, Calendar, DollarSign, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, hotels: 0, bookings: 0, revenue: 0 });
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Hotel Form State
  const [newHotel, setNewHotel] = useState({ name: '', location: '', description: '', rating: 0 });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, hotelsRes, bookingsRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/hotels'), // Public route is fine for reading
        axios.get('/api/admin/bookings', config)
      ]);

      setStats(statsRes.data);
      setHotels(hotelsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/hotels', newHotel, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewHotel({ name: '', location: '', description: '', rating: 0 });
      fetchData();
      alert('Hotel added successfully!');
    } catch (err) {
      alert('Failed to add hotel: ' + err.message);
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Are you sure? This will delete the hotel and all its rooms.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/hotels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete hotel: ' + err.message);
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to update booking: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button 
            className={`pb-4 px-4 font-medium text-lg transition-colors ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-4 px-4 font-medium text-lg transition-colors ${activeTab === 'hotels' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('hotels')}
          >
            Manage Hotels
          </button>
          <button 
            className={`pb-4 px-4 font-medium text-lg transition-colors ${activeTab === 'bookings' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('bookings')}
          >
            All Bookings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-lg text-blue-600"><Users size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-lg text-purple-600"><Hotel size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Hotels</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hotels}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-lg text-green-600"><Calendar size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className="bg-yellow-100 p-4 rounded-lg text-yellow-600"><DollarSign size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hotels Tab */}
        {activeTab === 'hotels' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-purple-600" /> Add New Hotel
                </h3>
                <form onSubmit={handleAddHotel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" required value={newHotel.name} onChange={e => setNewHotel({...newHotel, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" required value={newHotel.location} onChange={e => setNewHotel({...newHotel, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea required value={newHotel.description} onChange={e => setNewHotel({...newHotel, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" rows="3"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                    <input type="number" step="0.1" min="0" max="5" required value={newHotel.rating} onChange={e => setNewHotel({...newHotel, rating: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors">Add Hotel</button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hotels.map(hotel => (
                      <tr key={hotel.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{hotel.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{hotel.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{hotel.rating}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleDeleteHotel(hotel.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel & Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{booking.user_name_full || booking.user_name}</div>
                        <div className="text-sm text-gray-500">{booking.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{booking.hotel_name}</div>
                        <div className="text-sm text-gray-500">{booking.room_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${booking.total_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {booking.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 flex items-center justify-end gap-1 w-full"
                          >
                            <XCircle size={16} /> Cancel
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 flex items-center justify-end gap-1 w-full"
                          >
                            <CheckCircle size={16} /> Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
