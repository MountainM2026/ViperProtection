import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import View from './pages/View';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/view/:id" element={<View />} />
        <Route path="/view" element={<View />} />
      </Routes>
    </Router>
  );
}

export default App;