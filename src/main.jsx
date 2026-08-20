import { createRoot } from "react-dom/client";
import Home from "./components/Home";
import Delivery from "./components/profile";
import Reviews from "./components/reviews";
import Promotions from "./components/promotions";
import About from "./components/About";
import Basket from "./components/Basket";
import { BrowserRouter, Routes, Route } from "react-router";

import "./assets/bulma.min.css";
import "./style.css";

const savedTheme = localStorage.getItem("darkTheme");

if (savedTheme === "true") {
  document.body.classList.add("dark-theme");
} else {
  document.body.classList.remove("dark-theme");
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/delivery" element={<Delivery />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/promotions" element={<Promotions />} />
      <Route path="/About" element={<About />} />
      <Route path="/Basket" element={<Basket />} />
    </Routes>
  </BrowserRouter>
);
