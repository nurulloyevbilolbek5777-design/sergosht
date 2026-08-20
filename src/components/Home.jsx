import { useEffect, useState } from "react";
import Menu from "./menu";
import Navbar from "./Navbar";
import ProductList from "./ProductList";
import { Swiper, SwiperSlide } from "swiper/react";
import { ToastContainer } from "react-toastify";
import {
  Navigation,
  Autoplay,
  Pagination,
  Keyboard,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const API = "https://rest.sergosht-api.uz";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [slides, setSlides] = useState([]);

  const [isLoadingCategories, setIsLoadingCategories] =
    useState(true);

  const [isLoadingSlides, setIsLoadingSlides] =
    useState(true);

  const [categoriesError, setCategoriesError] =
    useState("");

  const [slidesError, setSlidesError] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [activeSlide, setActiveSlide] =
    useState(null);

  const [showScrollTop, setShowScrollTop] =
    useState(false);

  useEffect(() => {
    loadCategories();
    loadSlides();
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    function closeByEscape(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", closeByEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        closeByEscape
      );

      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  async function loadCategories() {
    setIsLoadingCategories(true);
    setCategoriesError("");

    try {
      const response = await fetch(
        `${API}/api/categories/?with_products=1`
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось загрузить меню"
        );
      }

      const data = await response.json();

      setCategories(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);

      setCategories([]);
      setCategoriesError(
        "Не удалось загрузить меню"
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }

  async function loadSlides() {
    setIsLoadingSlides(true);
    setSlidesError("");

    try {
      const response = await fetch(
        `${API}/api/slider/`
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось загрузить баннеры"
        );
      }

      const data = await response.json();

      setSlides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      setSlides([]);
      setSlidesError(
        "Не удалось загрузить баннеры"
      );
    } finally {
      setIsLoadingSlides(false);
    }
  }

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
    <div className="premium-home-page">
      <Navbar />

      <main className="home-container">
        <div className="home-layout">
          <aside className="home-sidebar">
            <Menu categories={categories} />
          </aside>

          <section className="home-main-content">
            {isLoadingSlides ? (
              <div className="home-slider-skeleton" />
            ) : slidesError ? (
              <section className="home-slider-error">
                <button
                  type="button"
                  onClick={loadSlides}
                >
                  Обновить баннеры
                </button>
              </section>
            ) : (
              slides.length > 0 && (
                <Swiper
                  modules={[
                    Navigation,
                    Autoplay,
                    Pagination,
                    Keyboard,
                  ]}
                  navigation
                  pagination={{
                    clickable: true,
                  }}
                  keyboard={{
                    enabled: true,
                  }}
                  autoplay={{
                    delay: 10000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                  }}
                  loop={slides.length > 1}
                  speed={650}
                  className="home-swiper"
                >
                  {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                      <button
                        type="button"
                        className="home-promo-button"
                        onClick={() => openModal(slide)}
                        aria-label={
                          slide.title
                            ? `Открыть: ${slide.title}`
                            : "Открыть акцию"
                        }
                      >
                        <img
                          src={slide.image}
                          alt={
                            slide.title ||
                            "Акция Ser Go'sht"
                          }
                        />

                        {slide.title && (
                          <span className="home-promo-label">
                            {slide.title}
                          </span>
                        )}
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )
            )}

            {categoriesError ? (
              <section className="home-error">
                <h1>Меню не загрузилось</h1>

                <button
                  type="button"
                  className="home-retry-button"
                  onClick={loadCategories}
                >
                  Попробовать снова
                </button>
              </section>
            ) : isLoadingCategories ? (
              <div className="home-menu-loading">
                <div className="home-category-skeleton">
                  <span />
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </div>

                <div className="home-category-skeleton">
                  <span />
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            ) : (
              categories.map((category) => (
                <ProductList
                  key={category.id}
                  products={
                    Array.isArray(category.products)
                      ? category.products
                      : []
                  }
                  title={category.title}
                  slug={category.slug}
                />
              ))
            )}
          </section>
        </div>
      </main>

      {isModalOpen && activeSlide && (
        <div
          className="home-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label={
            activeSlide.title || "Акция"
          }
        >
          <div
            className="home-modal-overlay"
            onClick={closeModal}
          />

          <section className="home-promo-modal">
            <button
              type="button"
              className="home-modal-close"
              onClick={closeModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="home-modal-image">
              <img
                src={activeSlide.image}
                alt={
                  activeSlide.title ||
                  "Акция Ser Go'sht"
                }
              />
            </div>

            {(activeSlide.title ||
              activeSlide.text) && (
              <div className="home-modal-content">
                {activeSlide.title && (
                  <h2>{activeSlide.title}</h2>
                )}

                {activeSlide.text && (
                  <p>{activeSlide.text}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <button
        type="button"
        className={`home-scroll-top ${
          showScrollTop ? "is-visible" : ""
        }`}
        onClick={scrollToTop}
        aria-label="Наверх"
        title="Наверх"
      >
        ↑
      </button>

      <ToastContainer />

      <style>{`
        .premium-home-page {
          --home-ink: #211812;
          --home-cream: #faf6ee;
          --home-line: #e8dece;
          --home-muted: #89796b;
          --home-ember: #c81e1e;
          --home-gold: #c89b3c;
          --home-shadow: 0 16px 42px -28px rgba(52, 31, 14, .42);

          min-height: 100vh;
          background: var(--home-cream);
          color: var(--home-ink);
        }

        .home-container {
          width: min(1240px, calc(100% - 36px));
          margin: 0 auto;
          padding: 26px 0 80px;
        }

        .home-layout {
          display: grid;
          grid-template-columns: 210px minmax(0, 1fr);
          align-items: start;
          gap: 26px;
        }

        .home-main-content,
        .home-sidebar {
          min-width: 0;
        }

        .home-swiper {
          overflow: hidden;
          margin-bottom: 42px;
          border: 1px solid var(--home-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: var(--home-shadow);
        }

        .home-promo-button {
          position: relative;
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .home-promo-button img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 6;
          object-fit: cover;
          transition: transform .45s var(--ease-out);
        }

        .home-promo-button:hover img {
          transform: scale(1.018);
        }

        .home-promo-label {
          position: absolute;
          bottom: 24px;
          left: 24px;
          max-width: calc(100% - 48px);
          padding: 9px 14px;
          border: 1px solid rgba(255, 255, 255, .25);
          border-radius: 999px;
          background: rgba(33, 24, 18, .45);
          color: #fff;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          backdrop-filter: blur(5px);
        }

        .home-swiper .swiper-button-next,
        .home-swiper .swiper-button-prev {
          display: grid;
          width: 42px !important;
          height: 42px !important;
          border-radius: 50%;
          background: rgba(33, 24, 18, .45);
          color: #fff !important;
          place-items: center;
          backdrop-filter: blur(4px);
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .home-swiper .swiper-button-next:hover,
        .home-swiper .swiper-button-prev:hover {
          background: var(--home-ember);
          transform: scale(1.08);
        }

        .home-swiper .swiper-button-next::after,
        .home-swiper .swiper-button-prev::after {
          font-size: 16px !important;
          font-weight: 800;
        }

        .home-swiper .swiper-pagination {
          bottom: 14px !important;
        }

        .home-swiper .swiper-pagination-bullet {
          width: 7px;
          height: 7px;
          background: rgba(255, 255, 255, .65);
          opacity: 1;
          transition:
            width .25s ease,
            background .25s ease;
        }

        .home-swiper .swiper-pagination-bullet-active {
          width: 22px;
          border-radius: 999px;
          background: var(--home-gold);
        }

        .home-slider-skeleton {
          aspect-ratio: 16 / 6;
          margin-bottom: 42px;
          border-radius: 24px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: home-shimmer 1.2s ease infinite;
        }

        .home-slider-error {
          display: grid;
          min-height: 180px;
          margin-bottom: 42px;
          border: 1px dashed var(--home-line);
          border-radius: 24px;
          background: rgba(255, 255, 255, .55);
          place-items: center;
        }

        .home-slider-error button,
        .home-retry-button {
          min-height: 46px;
          padding: 0 22px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--home-ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .home-slider-error button:hover,
        .home-retry-button:hover {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          transform: translateY(-2px);
        }

        .home-menu-loading {
          display: grid;
          gap: 48px;
        }

        .home-category-skeleton {
          display: grid;
          gap: 19px;
        }

        .home-category-skeleton > span {
          display: block;
          width: 180px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: home-shimmer 1.2s ease infinite;
        }

        .home-category-skeleton > div {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .home-category-skeleton i {
          display: block;
          min-height: 280px;
          border-radius: 18px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: home-shimmer 1.2s ease infinite;
        }

        @keyframes home-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .home-error {
          padding: 65px 20px;
          border: 1px dashed var(--home-line);
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          text-align: center;
        }

        .home-error h1 {
          margin: 0 0 18px;
          color: var(--home-ink);
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
        }

        .home-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .home-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(33, 24, 18, .62);
          backdrop-filter: blur(5px);
        }

        .home-promo-modal {
          position: relative;
          width: min(920px, 100%);
          max-height: 90vh;
          overflow: auto;
          border: 1px solid var(--home-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(33, 24, 18, .65);
          animation: home-modal-show .25s var(--ease-out);
        }

        @keyframes home-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .home-modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 2;
          display: grid;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255, 255, 255, .5);
          border-radius: 50%;
          background: rgba(33, 24, 18, .48);
          color: #fff;
          cursor: pointer;
          font-size: 23px;
          line-height: 1;
          place-items: center;
          backdrop-filter: blur(4px);
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .home-modal-close:hover {
          background: var(--home-ember);
          transform: rotate(90deg);
        }

        .home-modal-image {
          overflow: hidden;
          background: #f1e8da;
        }

        .home-modal-image img {
          display: block;
          width: 100%;
          max-height: 70vh;
          object-fit: contain;
        }

        .home-modal-content {
          padding: 24px 28px 28px;
        }

        .home-modal-content h2 {
          margin: 0 0 10px;
          color: var(--home-ink);
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
        }

        .home-modal-content p {
          margin: 0;
          color: #66584c;
          font-size: 14px;
          line-height: 1.7;
        }

        .home-scroll-top {
          position: fixed;
          right: 24px;
          bottom: 28px;
          z-index: 90;
          display: grid;
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--home-ember)
          );
          box-shadow: 0 12px 26px -10px rgba(200, 30, 30, .65);
          color: #fff;
          cursor: pointer;
          font-size: 25px;
          font-weight: 700;
          opacity: 0;
          pointer-events: none;
          place-items: center;
          transform: translateY(15px);
          transition:
            opacity .25s ease,
            transform .25s var(--ease-out);
        }

        .home-scroll-top.is-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .home-scroll-top:hover {
          transform: translateY(-3px);
        }

        body.dark-theme .premium-home-page {
          background: #17110f;
        }

        body.dark-theme .home-swiper,
        body.dark-theme .home-promo-modal {
          border-color: #45342b;
          background: #251b17;
        }

        body.dark-theme .home-slider-skeleton,
        body.dark-theme .home-category-skeleton > span,
        body.dark-theme .home-category-skeleton i {
          background: linear-gradient(
            90deg,
            #2b201b,
            #382921,
            #2b201b
          );
          background-size: 200% 100%;
        }

        body.dark-theme .home-error,
        body.dark-theme .home-slider-error {
          border-color: #45342b;
          background: #251b17;
        }

        body.dark-theme .home-error h1,
        body.dark-theme .home-modal-content h2 {
          color: #f8f3ea;
        }

        body.dark-theme .home-modal-content p {
          color: #c7b9aa;
        }

        @media screen and (max-width: 1024px) {
          .home-layout {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }

        @media screen and (max-width: 760px) {
          .home-container {
            width: calc(100% - 24px);
            padding-top: 18px;
          }

          .home-swiper,
          .home-slider-skeleton,
          .home-slider-error {
            margin-bottom: 28px;
            border-radius: 18px;
          }

          .home-promo-button img,
          .home-slider-skeleton {
            aspect-ratio: 16 / 8;
          }

          .home-promo-label {
            bottom: 16px;
            left: 16px;
            max-width: calc(100% - 32px);
            font-size: 13px;
          }

          .home-swiper .swiper-button-next,
          .home-swiper .swiper-button-prev {
            width: 34px !important;
            height: 34px !important;
          }

          .home-category-skeleton > div {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .home-category-skeleton i {
            min-height: 230px;
          }

          .home-modal-root {
            padding: 0;
            align-items: end;
          }

          .home-promo-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .home-modal-content {
            padding: 20px;
          }

          .home-scroll-top {
            right: 16px;
            bottom: 84px;
          }
        }

        @media screen and (max-width: 420px) {
          .home-category-skeleton > div {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
