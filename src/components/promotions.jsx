import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";

const API = "https://rest.sergosht-api.uz";

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activePromotion, setActivePromotion] =
    useState(null);

  useEffect(() => {
    loadPromotions(true);
  }, []);

  useEffect(() => {
    if (!activePromotion) return;

    function closeByEscape(event) {
      if (event.key === "Escape") {
        closePromotion();
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
  }, [activePromotion]);

  async function loadPromotions(showLoader = false) {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch(`${API}/api/slider/`);

      if (!response.ok) {
        throw new Error(
          "Не удалось загрузить акции"
        );
      }

      const data = await response.json();

      setPromotions(
        Array.isArray(data) ? data : []
      );
    } catch (requestError) {
      console.error(requestError);

      setPromotions([]);
      setError(
        requestError.message ||
          "Не удалось загрузить акции"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function openPromotion(promotion) {
    setActivePromotion(promotion);
  }

  function closePromotion() {
    setActivePromotion(null);
  }

  return (
    <div className="promotions-page">
      <Navbar />

      <main className="promotions-container">
        <nav
          className="promotions-breadcrumb"
          aria-label="Навигация"
        >
          <NavLink to="/">Главная</NavLink>
          <span>/</span>
          <span className="is-current">Акции</span>
        </nav>

        <header className="promotions-header">
          <h1>Акции</h1>

          <button
            type="button"
            className={`promotions-refresh ${
              isRefreshing ? "is-spinning" : ""
            }`}
            onClick={() => loadPromotions(false)}
            disabled={isLoading || isRefreshing}
            aria-label="Обновить акции"
            title="Обновить акции"
          >
            ↻
          </button>
        </header>

        {error ? (
          <section className="promotions-error">
            <h2>Не удалось загрузить акции</h2>

            <button
              type="button"
              className="promotions-primary-button"
              onClick={() => loadPromotions(false)}
            >
              Попробовать снова
            </button>
          </section>
        ) : isLoading ? (
          <div className="promotions-grid">
            {[0, 1, 2].map((item) => (
              <div
                className="promotion-skeleton"
                key={item}
              />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <section className="promotions-empty">
            <h2>Сейчас нет акций</h2>

            <p>Новые предложения появятся здесь.</p>

            <NavLink
              to="/"
              className="promotions-primary-button"
            >
              Перейти в меню
            </NavLink>
          </section>
        ) : (
          <section className="promotions-grid">
            {promotions.map((promotion, index) => (
              <article
                className="promotion-card"
                key={
                  promotion.id ||
                  promotion._id ||
                  `promotion-${index}`
                }
              >
                <div className="promotion-image">
                  <img
                    src={promotion.image}
                    alt={
                      promotion.title ||
                      "Акция Ser Go'sht"
                    }
                    loading="lazy"
                  />
                </div>

                <div className="promotion-content">
                  <div>
                    <h2>
                      {promotion.title || "Акция"}
                    </h2>

                    {promotion.text && (
                      <p>{promotion.text}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="promotion-details-button"
                    onClick={() =>
                      openPromotion(promotion)
                    }
                  >
                    Подробнее
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {activePromotion && (
        <div
          className="promotion-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label={
            activePromotion.title || "Акция"
          }
        >
          <div
            className="promotion-overlay"
            onClick={closePromotion}
          />

          <section className="promotion-modal">
            <button
              type="button"
              className="promotion-close"
              onClick={closePromotion}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="promotion-modal-image">
              <img
                src={activePromotion.image}
                alt={
                  activePromotion.title ||
                  "Акция Ser Go'sht"
                }
              />
            </div>

            <div className="promotion-modal-content">
              <h2>
                {activePromotion.title || "Акция"}
              </h2>

              {activePromotion.text && (
                <p>{activePromotion.text}</p>
              )}

              <NavLink
                to="/"
                className="promotions-primary-button"
                onClick={closePromotion}
              >
                Перейти в меню
              </NavLink>
            </div>
          </section>
        </div>
      )}

      <style>{`
        .promotions-page {
          --promo-ink: #211812;
          --promo-cream: #faf6ee;
          --promo-line: #e8dece;
          --promo-muted: #89796b;
          --promo-ember: #c81e1e;
          --promo-ember-light: #e8432f;
          --promo-gold: #c89b3c;
          --promo-shadow: 0 16px 42px -28px rgba(52, 31, 14, .42);
          --promo-shadow-hover: 0 27px 58px -28px rgba(52, 31, 14, .48);

          min-height: 100vh;
          background: var(--promo-cream);
          color: var(--promo-ink);
        }

        .promotions-container {
          width: min(1100px, calc(100% - 36px));
          margin: 0 auto;
          padding: 28px 0 80px;
        }

        .promotions-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--promo-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .promotions-breadcrumb a {
          color: var(--promo-muted);
          text-decoration: none;
          transition: color .2s ease;
        }

        .promotions-breadcrumb a:hover {
          color: var(--promo-ember);
        }

        .promotions-breadcrumb .is-current {
          color: var(--promo-ink);
        }

        .promotions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: 22px 0 30px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--promo-line);
        }

        .promotions-header h1 {
          margin: 0;
          color: var(--promo-ink);
          font-family: var(--font-display);
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .promotions-refresh {
          display: grid;
          width: 46px;
          height: 46px;
          border: 1px solid var(--promo-line);
          border-radius: 50%;
          background: #fff;
          color: var(--promo-ink);
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            transform .2s ease,
            border-color .2s ease,
            color .2s ease;
        }

        .promotions-refresh:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--promo-ember);
          transform: rotate(25deg);
        }

        .promotions-refresh:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .promotions-refresh.is-spinning {
          animation: promo-spin .8s linear infinite;
        }

        @keyframes promo-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .promotions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .promotion-card {
          display: flex;
          min-height: 100%;
          overflow: hidden;
          flex-direction: column;
          border: 1px solid var(--promo-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--promo-shadow);
          transition:
            transform .28s var(--ease-out),
            box-shadow .28s ease,
            border-color .28s ease;
        }

        .promotion-card:hover {
          border-color: rgba(200, 155, 60, .55);
          box-shadow: var(--promo-shadow-hover);
          transform: translateY(-4px);
        }

        .promotion-image {
          overflow: hidden;
          background: #f2e8da;
        }

        .promotion-image img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          transition: transform .45s var(--ease-out);
        }

        .promotion-card:hover .promotion-image img {
          transform: scale(1.04);
        }

        .promotion-content {
          display: flex;
          min-height: 180px;
          flex: 1;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px;
        }

        .promotion-content h2 {
          margin: 0 0 10px;
          color: var(--promo-ink);
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 600;
          line-height: 1.2;
        }

        .promotion-content p {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: #66584c;
          font-size: 14px;
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .promotion-details-button {
          align-self: flex-start;
          margin-top: 20px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--promo-ember);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 800;
        }

        .promotion-details-button:hover {
          text-decoration: underline;
        }

        .promotions-primary-button {
          display: inline-grid;
          min-height: 46px;
          padding: 0 22px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            var(--promo-ember-light),
            var(--promo-ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          place-items: center;
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .promotions-primary-button:hover {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          color: #fff;
          transform: translateY(-2px);
        }

        .promotions-empty,
        .promotions-error {
          padding: 70px 20px;
          border: 1px dashed var(--promo-line);
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          text-align: center;
        }

        .promotions-empty h2,
        .promotions-error h2 {
          margin: 0 0 9px;
          color: var(--promo-ink);
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
        }

        .promotions-empty p {
          margin: 0 0 22px;
          color: var(--promo-muted);
          font-size: 14px;
        }

        .promotion-skeleton {
          min-height: 360px;
          border-radius: 20px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: promotion-shimmer 1.2s ease infinite;
        }

        @keyframes promotion-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .promotion-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .promotion-overlay {
          position: absolute;
          inset: 0;
          background: rgba(33, 24, 18, .62);
          backdrop-filter: blur(5px);
        }

        .promotion-modal {
          position: relative;
          width: min(900px, 100%);
          max-height: 90vh;
          overflow: auto;
          border: 1px solid var(--promo-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(33, 24, 18, .65);
          animation: promotion-modal-show .25s var(--ease-out);
        }

        @keyframes promotion-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .promotion-close {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 2;
          display: grid;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 50%;
          background: rgba(33, 24, 18, .45);
          color: #fff;
          cursor: pointer;
          font-size: 23px;
          place-items: center;
          backdrop-filter: blur(4px);
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .promotion-close:hover {
          background: var(--promo-ember);
          transform: rotate(90deg);
        }

        .promotion-modal-image {
          background: #f2e8da;
        }

        .promotion-modal-image img {
          width: 100%;
          max-height: 65vh;
          object-fit: contain;
        }

        .promotion-modal-content {
          padding: 25px 28px 30px;
        }

        .promotion-modal-content h2 {
          margin: 0 0 12px;
          color: var(--promo-ink);
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 600;
        }

        .promotion-modal-content p {
          margin: 0 0 24px;
          color: #66584c;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        body.dark-theme .promotions-page {
          background: #17110f;
        }

        body.dark-theme .promotion-card,
        body.dark-theme .promotion-modal {
          border-color: #45342b;
          background: #251b17;
        }

        body.dark-theme .promotion-content h2,
        body.dark-theme .promotion-modal-content h2 {
          color: #f8f3ea;
        }

        body.dark-theme .promotion-content p,
        body.dark-theme .promotion-modal-content p {
          color: #c7b9aa;
        }

        body.dark-theme .promotions-empty,
        body.dark-theme .promotions-error {
          border-color: #45342b;
          background: #251b17;
        }

        body.dark-theme .promotions-empty h2,
        body.dark-theme .promotions-error h2 {
          color: #f8f3ea;
        }

        body.dark-theme .promotions-refresh {
          border-color: #45342b;
          background: #251b17;
          color: #f8f3ea;
        }

        @media screen and (max-width: 760px) {
          .promotions-container {
            width: calc(100% - 24px);
            padding-top: 18px;
          }

          .promotions-grid {
            grid-template-columns: 1fr;
          }

          .promotion-content {
            min-height: 155px;
            padding: 19px;
          }

          .promotion-modal-root {
            padding: 0;
            align-items: end;
          }

          .promotion-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .promotion-modal-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
