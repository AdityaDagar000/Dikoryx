import Home from "./Pages/Home";
import Pricing from "./Pages/Pricing";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import FooterPage from "./Pages/FooterPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const showFooter = location.pathname === "/";

  return (
    <>
      <HashScroll />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/platform/:slug" element={<FooterPage />} />
        <Route path="/company/:slug" element={<FooterPage />} />
        <Route path="/resources/:slug" element={<FooterPage />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
}

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    window.setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }, [location]);

  return null;
}

export default App;
