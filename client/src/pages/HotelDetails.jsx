import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, User, ArrowLeft, CheckCircle, BedDouble, Wifi, Tv, Coffee, Bath, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DateRange } from 'react-date-range';
import { format, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

const getIconForAmenity = (amenity) => {
  const lower = amenity.toLowerCase();
  if (lower.includes('wifi')) return <Wifi size={16} />;
  if (lower.includes('tv')) return <Tv size={16} />;
  if (lower.includes('bar') || lower.includes('kitchen')) return <Coffee size={16} />;
  if (lower.includes('jacuzzi') || lower.includes('spa') || lower.includes('tub')) return <Bath size={16} />;
  return <CheckCircle size={16} />;
};

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      key: 'selection'
    }
  ]);

  useEffect(() => {
    axios.get(`/api/hotels/${id}`)
      .then(res => {
        setHotel(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please login to book a room');
    if (!selectedRoom) return alert('Please select a room');
    
    const checkIn = format(dateRange[0].startDate, 'yyyy-MM-dd');
    const checkOut = format(dateRange[0].endDate, 'yyyy-MM-dd');
    const nights = differenceInDays(dateRange[0].endDate, dateRange[0].startDate);
    
    if (nights <= 0) return alert('Check-out date must be after check-in date');

    try {
      // Check availability first
      const availRes = await axios.get(`/api/rooms/${selectedRoom.id}/availability?check_in=${checkIn}&check_out=${checkOut}`);
      
      if (!availRes.data.available) {
        setAvailabilityError(availRes.data.message);
        return;
      }

      const total_price = selectedRoom.price * nights;

      await axios.post('/api/bookings', { 
        user_name: user.name,
        email: user.email,
        room_id: selectedRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        total_price 
      });

      setBookingSuccess(true);
      setAvailabilityError('');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      alert('Booking Failed: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center text-2xl text-gray-500">Hotel not found</div>;

  const nights = differenceInDays(dateRange[0].endDate, dateRange[0].startDate);
  const totalPrice = selectedRoom ? selectedRoom.price * Math.max(1, nights) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Search
        </button>

        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-64 md:h-96 bg-gray-200 relative">
            {hotel.image_url ? (
              <img 
                src={hotel.image_url} 
                alt={hotel.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BedDouble size={64} className="text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-lg">{hotel.name}</h1>
                  <p className="flex items-center gap-2 text-lg md:text-xl drop-shadow-md">
                    <MapPin size={24} className="text-blue-400" />
                    {hotel.location}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xl font-bold border border-white/30 shadow-lg">
                  <Star size={24} className="mr-2 text-yellow-400 fill-current" />
                  {hotel.rating}
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 bg-white">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">About this property</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              {hotel.description}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rooms List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Rooms</h2>
            <motion.div 
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
            >
              {hotel.rooms && hotel.rooms.map((room) => (
                <motion.div 
                  key={room.id} 
                  className={`bg-white rounded-2xl shadow-md p-6 border-2 cursor-pointer transition-all duration-300 ${selectedRoom?.id === room.id ? 'border-blue-600 ring-4 ring-blue-100 shadow-xl scale-[1.02]' : 'border-transparent hover:border-blue-300 hover:shadow-lg'}`}
                  onClick={() => {
                    setSelectedRoom(room);
                    setAvailabilityError('');
                  }}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{room.type}</h3>
                      <p className="text-gray-500 flex items-center gap-2 mt-2 font-medium">
                        <User size={18} className="text-blue-500" /> Up to {room.capacity} guests
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-blue-600">${room.price}</span>
                      <span className="text-gray-500 text-sm block">/night</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                    {room.amenities.map(a => (
                      <span key={a} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                        {getIconForAmenity(a)} {a}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-white rounded-2xl shadow-xl p-8 sticky top-8 border border-gray-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Book Your Stay</h3>
              
              <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  minDate={new Date()}
                  className="w-full"
                  rangeColors={['#2563eb']}
                />
              </div>

              {selectedRoom ? (
                <motion.div 
                  className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h4 className="font-bold text-blue-900 mb-3 text-lg">Selected Room</h4>
                  <p className="text-blue-800 flex justify-between font-medium">
                    <span>{selectedRoom.type}</span>
                    <span>${selectedRoom.price} x {nights} nights</span>
                  </p>
                  <div className="border-t border-blue-200 my-3 pt-3 flex justify-between font-extrabold text-xl text-blue-900">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center text-gray-500 border border-gray-200 border-dashed font-medium">
                  Please select a room to see pricing
                </div>
              )}

              {availabilityError && (
                <motion.div 
                  className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="block w-2 h-2 bg-red-500 rounded-full"></span>
                  {availabilityError}
                </motion.div>
              )}

              <AnimatePresence>
                {bookingSuccess ? (
                  <motion.div 
                    className="bg-green-50 text-green-700 p-6 rounded-xl text-center border border-green-200 shadow-sm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                    <p className="font-extrabold text-xl">Booking Confirmed!</p>
                    <p className="text-sm mt-2 font-medium">Redirecting to dashboard...</p>
                  </motion.div>
                ) : (
                  <button 
                    onClick={handleBooking}
                    disabled={!selectedRoom || !user}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                      !user ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' :
                      !selectedRoom ? 'bg-blue-300 text-white cursor-not-allowed shadow-none' :
                      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30 transform hover:-translate-y-1'
                    }`}
                  >
                    {!user ? 'Login to Book' : 'Confirm Booking'}
                  </button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
