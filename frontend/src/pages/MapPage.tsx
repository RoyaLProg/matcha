
import React from 'react';
import Layout from '../components/Layout';
import UserMap from '../components/UserMap';

const MapPage = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserMap />
      </div>
    </Layout>
  );
};

export default MapPage;
