'use client';

import { motion, Variants } from 'framer-motion';
import { blogs } from '@/lib/blogsData';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

export default function Home() {
  return (
    <div className="bg-gray-900 text-white font-sans min-h-screen">
      {/* Hero Section with Fixed Background */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/0 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight">
            Empowering Futures
          </h1>
          <p className="text-xl sm:text-2xl mb-10 max-w-4xl mx-auto leading-relaxed">
            Welcome to our platform dedicated to fostering innovation, collaboration, and excellence in education. Join us in shaping a brighter future for students worldwide.
          </p>
          <a
            href="#mission"
            className="inline-block bg-green-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-full transition duration-300"
          >
            Discover Our Mission
          </a>
        </div>
      </motion.section>

      {/* Mission & Vision Section with Same Background */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
        id="mission"
      >
        <div className="absolute inset-0 bg-black/0 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side: Text Content */}
            <div className="lg:w-1/2 bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-green-600/20">
              <h2 className="text-4xl font-bold text-white mb-8">Our Mission & Vision</h2>
              <p className="text-lg text-white/80 mb-12 max-w-3xl leading-relaxed">
                We are committed to creating an inclusive and dynamic environment where students thrive, innovate, and lead with confidence.
              </p>
              <div className="grid grid-cols-1 gap-8">
                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-green-600/20 hover:border-red-500/20 transition duration-300">
                  <h3 className="text-2xl font-semibold text-white mb-4">Our Mission</h3>
                  <p className="text-white/80 leading-relaxed">
                    To empower students by providing unparalleled opportunities for growth, collaboration, and academic excellence through a supportive global community.
                  </p>
                </div>
                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-green-600/20 hover:border-red-500/20 transition duration-300">
                  <h3 className="text-2xl font-semibold text-white mb-4">Our Vision</h3>
                  <p className="text-white/80 leading-relaxed">
                    To be the leading global platform inspiring students to achieve their highest potential and drive transformative change in education.
                  </p>
                </div>
              </div>
            </div>
            {/* Right Side: Image */}
            <div className="lg:w-1/2 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655"
                alt="Students collaborating"
                className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Gallery Section with Same Background */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
        id="gallery"
      >
        <div className="absolute inset-0 bg-black/0 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-green-600/20">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Our Events</h2>
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto text-center leading-relaxed">
              Explore the vibrant moments from our community events, workshops, and initiatives that bring students together to learn, collaborate, and inspire.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  src: 'https://images.unsplash.com/photo-1516321310767-0d0c0b43b716',
                  alt: 'Event 1: Student Workshop',
                },
                {
                  src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
                  alt: 'Event 2: Community Gathering',
                },
                {
                  src: 'https://images.unsplash.com/photo-1542744173-05336fcc7ad4',
                  alt: 'Event 3: Innovation Summit',
                },
                {
                  src: 'https://images.unsplash.com/photo-1543269865-0a740d43b90c',
                  alt: 'Event 4: Leadership Conference',
                },
                {
                  src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
                  alt: 'Event 5: Networking Event',
                },
                {
                  src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04',
                  alt: 'Event 6: Educational Seminar',
                },
              ].map((image, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="relative overflow-hidden rounded-lg border border-green-600/20 hover:border-red-500/20 transition duration-300"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Current Panel Section with Same Background */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('/images/placeholder.jpg')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
        id="panel"
      >
        <div className="absolute inset-0 bg-black/0 "></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-green-600/20">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Our Current Panel</h2>
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto text-center leading-relaxed">
              Meet our dedicated leadership team driving the vision and mission of our organization forward.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'John Doe',
                  role: 'President',
                  description: 'Leads the organization with a focus on strategic growth and community engagement.',
                },
                {
                  name: 'Jane Smith',
                  role: 'Vice President',
                  description: 'Supports the president and drives initiatives to enhance member experience.',
                },
                {
                  name: 'Alex Johnson',
                  role: 'General Secretary',
                  description: 'Manages communications and ensures smooth organizational operations.',
                },
                {
                  name: 'Emily Davis',
                  role: 'Event Coordinator',
                  description: 'Plans and executes impactful events to foster collaboration and learning.',
                },
                {
                  name: 'Michael Brown',
                  role: 'Webmaster',
                  description: 'Oversees the digital presence, ensuring a seamless online experience.',
                },
                {
                  name: 'Sarah Wilson',
                  role: 'Treasurer',
                  description: 'Manages finances to support our initiatives and ensure sustainability.',
                },
              ].map((member, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-green-600/20 hover:border-red-500/20 transition duration-300"
                >
                  <h3 className="text-2xl font-semibold text-white mb-2">{member.name}</h3>
                  <p className="text-lg text-white/90 mb-4">{member.role}</p>
                  <p className="text-white/80 leading-relaxed">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Blogs Section with Card Style */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
        id="blogs"
      >
        <div className="absolute inset-0 bg-black/0 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-green-600/20">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Our Blogs</h2>
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto text-center leading-relaxed">
              Explore insightful articles and resources designed to help students succeed in their educational journey.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.slice(0, 6).map((blog, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="relative overflow-hidden rounded-lg border border-green-600/20 hover:border-red-500/20 transition duration-300"
                >
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 bg-black/5 backdrop-blur-md"> {/* Reduced padding */}
                    <h3 className="text-xl font-semibold text-white mb-2">{blog.title}</h3> {/* Adjusted font size */}
                    <p className="text-black/80 mb-4 leading-relaxed">{blog.excerpt}</p>
                    <a
                      href={`/blogs/${blog.slug}`}
                      className="text-black-600 hover:text-red-500 font-medium transition-colors duration-200"
                    >
                      Read More
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Ongoing Events Section with Same Background */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')] bg-cover bg-center bg-fixed min-h-screen flex items-center justify-center"
        id="ongoing-events"
      >
        <div className="absolute inset-0 bg-black/0 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-green-600/20">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Ongoing Events</h2>
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto text-center leading-relaxed">
              Join our current events to connect, learn, and grow with our community.
            </p>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side: Photo */}
              <div className="lg:w-1/2 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1516321310767-0d0c0b43b716"
                  alt="Ongoing Event"
                  className="w-full h-auto max-h-[400px] object-cover rounded-2xl shadow-lg"
                />
              </div>
              {/* Right Side: Registration Options */}
              <div className="lg:w-1/2 bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-green-600/20">
                <h3 className="text-2xl font-semibold text-white mb-6">Register Now</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Choose your registration type and join us. Deadline: September 15, 2025.
                </p>
                <div className="space-y-4">
                  <a
                    href="#student-registration"
                    className="block bg-green-600 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-full text-center transition duration-300"
                  >
                    Register as Student
                  </a>
                  <a
                    href="#community-registration"
                    className="block bg-green-600 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-full text-center transition duration-300"
                  >
                    Register as Community Member
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}