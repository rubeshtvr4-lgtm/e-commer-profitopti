import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Navy Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
