import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import ToolContainer from './pages/ToolContainer';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        {/* 动态路由：所有工具都通过这个路由加载 */}
        <Route path="/tools/:category/:toolId" element={<ToolContainer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
