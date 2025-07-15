import React from 'react';
import { Heart, Users, MessageCircle, Shield, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mb-8 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your
              <span className="block bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
                Perfect Match
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with people who share your interests, values, and dreams. 
              Start meaningful relationships that last a lifetime.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-200"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center px-8 py-4 bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-600 font-semibold rounded-xl transition-all hover:bg-blue-50"
              >
                Browse Profiles
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-300 rounded-full opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-sky-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-blue-200 rounded-full opacity-50"></div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Matcha?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're not just another dating app. We're your partner in finding authentic connections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all blue-card-hover">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Matching</h3>
              <p className="text-gray-600">
                Our advanced algorithm finds compatible matches based on your interests, values, and preferences.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all blue-card-hover">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Meaningful Conversations</h3>
              <p className="text-gray-600">
                Connect through thoughtful conversations with people who truly understand you.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all blue-card-hover">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safe & Secure</h3>
              <p className="text-gray-600">
                Your privacy and security are our top priorities. All profiles are verified and protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-gray-600">
              Real couples who found love through Matcha
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 blue-card-hover">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-blue-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "We matched on Matcha two years ago and got married last month! The app helped us find exactly what we were looking for in each other."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah & Mike</p>
                  <p className="text-gray-500 text-sm">Together for 2 years</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 blue-card-hover">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-blue-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "I wasn't sure about online dating, but Matcha changed my mind. The quality of matches and conversations was amazing from day one."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold text-gray-900">Emma & David</p>
                  <p className="text-gray-500 text-sm">Together for 1 year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-500 to-sky-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Match?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of singles who have already found love on Matcha
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;