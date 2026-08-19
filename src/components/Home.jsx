import { useEffect, useState } from "react";
import Menu from "./menu";
import Navbar from "./Navbar";
import ProductList from "./ProductList";
import { Swiper, SwiperSlide } from "swiper/react";
import { ToastContainer } from "react-toastify";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [slides, setSlides] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetch("https://rest.sergosht-api.uz/api/categories/?with_products=1")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить категории");
        }

        return response.json();
      })
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(error);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    fetch("https://rest.sergosht-api.uz/api/slider/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить баннеры");
        }

        return response.json();
      })
      .then((data) => {
        setSlides(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(error);
        setSlides([]);
      });
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function openModal(slide) {
    setActiveSlide(slide);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setActiveSlide(null);
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="home-page">
      <Navbar />

      <div className={`modal ${isModalOpen ? "is-active" : ""}`}>
        <div
          className="modal-background"
          onClick={closeModal}
          role="button"
          tabIndex={0}
          aria-label="Закрыть баннер"
        />

        <div className="modal-content promo-modal-content">
          {activeSlide && (
            <div className="promo-modal-card">
              <div className="card-image">
                <figure className="image is-16by9">
                  <img
                    src={activeSlide.image}
                    alt={activeSlide.title || "Акция Ser Go'sht"}
                  />
                </figure>
              </div>

              {(activeSlide.title || activeSlide.text) && (
                <div className="promo-modal-body">
                  {activeSlide.title && (
                    <h2 className="title is-4">{activeSlide.title}</h2>
                  )}

                  {activeSlide.text && (
                    <p className="content">{activeSlide.text}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="modal-close is-large"
          aria-label="Закрыть"
          onClick={closeModal}
        />
      </div>

      <main className="container mt-5 mb-6">
        <div className="columns">
          <div className="column is-2">
            <Menu categories={categories} />
          </div>

          <div className="column is-10">
            <section className="home-content">
              {slides.length > 0 && (
                <Swiper
                  navigation
                  modules={[Navigation]}
                  className="swiper main-swiper"
                >
                  {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                      <button
                        type="button"
                        className="promo-slide-button"
                        onClick={() => openModal(slide)}
                        aria-label={
                          slide.title
                            ? `Открыть акцию: ${slide.title}`
                            : "Открыть акцию"
                        }
                      >
                        <img
                          src={slide.image}
                          alt={slide.title || "Акция Ser Go'sht"}
                        />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}

              {categories.map((category) => (
                <ProductList
                  key={category.id}
                  products={Array.isArray(category.products) ? category.products : []}
                  title={category.title}
                  slug={category.slug}
                />
              ))}
            </section>
          </div>
        </div>
      </main>

      <button
        type="button"
        className={`scroll-to-top ${showScrollTop ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Наверх"
        title="Наверх"
      >
        ↑
      </button>

      <ToastContainer />
    </div>
  );
}
