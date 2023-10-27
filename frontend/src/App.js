import { BrowserRouter, Routes, Route } from "react-router-dom";

import './App.css';
import {PlantNet} from './pages/pl@ntNet';
import Dashboard from './pages/dashboard';
import DownloadWebscrap from "./pages/downloadWebscrap";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<PlantNet />} />
        <Route path="/download" element={<DownloadWebscrap />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
