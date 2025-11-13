import { Link } from 'react-router-dom';
import { Video, Sparkles, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Nim
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/feed"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Explore
              </Link>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Create stunning videos
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              powered by AI
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Transform your ideas into captivating short-form videos with AI.
            No experience needed.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start Creating Free
            </Link>
            <Link
              to="/feed"
              className="bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-700 transition-all"
            >
              Explore Stories
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
              <Video className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                AI Video Generation
              </h3>
              <p className="text-gray-400">
                Generate professional videos from text prompts in seconds
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
              <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Story Editor
              </h3>
              <p className="text-gray-400">
                Combine clips, add music and text to create compelling stories
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
              <Users className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Social Platform
              </h3>
              <p className="text-gray-400">
                Share your creations and build an audience
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
              <Zap className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-400">
                Create your first video in under 30 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
