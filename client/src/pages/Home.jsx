import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Star, Search, BedDouble } from 'lucide-react';

const Home = () => {
  const [hotels, setHotels] = useState([]);
  const [searchParams, setSearchParams] = useState({
    location: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const query = new URLSearchParams(searchParams).toString();
      const res = await axios.get(`/api/hotels?${query}`);
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white py-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?auto=format&fit=crop&w=1920&q=80" 
            alt="Luxury Hotel" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/90"></div>
        </div>

        <div className="relative z-10">
          <motion.h1 
            className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Find Your Perfect Stay
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto drop-shadow-md"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            Discover luxury hotels, cozy cabins, and beautiful resorts around the world.
          </motion.p>

          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"
                value={searchParams.location}
                onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
              />
            </div>
            <div className="flex gap-4 flex-1">
              <input 
                type="number" 
                placeholder="Min Price" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"
                value={searchParams.minPrice}
                onChange={(e) => setSearchParams({...searchParams, minPrice: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Max Price" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"
                value={searchParams.maxPrice}
                onChange={(e) => setSearchParams({...searchParams, maxPrice: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Search size={20} />
              Search
            </button>
          </motion.form>
        </div>
      </div>

      {/* Hotel List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Popular Destinations</h2>
        
        {hotels.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <BedDouble size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No hotels found matching your criteria.</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {hotels.map((hotel) => (
              <motion.div 
                key={hotel.id} 
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -8 }}
              >
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  {hotel.image_url ? (
                    <img 
                      src={hotel.image_url} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <BedDouble size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900 shadow-sm flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    {hotel.rating}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">{hotel.name}</h3>
                  <p className="text-gray-600 flex items-center gap-1 mb-4 font-medium">
                    <MapPin size={18} className="text-blue-500" />
                    {hotel.location}
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                    {hotel.description}
                  </p>
                  <Link 
                    to={`/hotel/${hotel.id}`}
                    className="block w-full text-center bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
