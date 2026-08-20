import { useEffect, useState } from "react";
import Product from "./Product";
import { toast } from "react-toastify";

const API = "https://rest.sergosht-api.uz";

function getCartFromStorage() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("ru-RU");
}

function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  return `${API}${image}`;
}

export default function ProductList({
  products = [],
  slug,
  title,
}) {
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [activeProduct, setActiveProduct] =
    useState(null);

  const [count, setCount] = useState(1);

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

  function openModal(product) {
    setActiveProduct(product);
    setCount(1);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setActiveProduct(null);
    setCount(1);
  }

  function increaseCount() {
    setCount((previous) => previous + 1);
  }

  function decreaseCount() {
    setCount((previous) =>
      Math.max(1, previous - 1)
    );
  }

  function addToCart() {
    if (!activeProduct) return;

    let cart = getCartFromStorage();

    const existingProduct = cart.find(
      (item) => item.id === activeProduct.id
    );

    const productImage = getImageUrl(
      activeProduct.image
    );

    let newCount = count;

    if (existingProduct) {
      newCount =
        Number(existingProduct.count || 1) + count;

      cart = cart.map((item) => {
        if (item.id === activeProduct.id) {
          return {
            ...item,
            count: newCount,
          };
        }

        return item;
      });
    } else {
      cart.push({
        id: activeProduct.id,
        title: activeProduct.title,
        price: activeProduct.price,
        description: activeProduct.description,
        photo: productImage,
        count,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("storage"));

    toast.success(
      existingProduct
        ? `В корзине ${newCount} шт. «${activeProduct.title}»`
        : `«${activeProduct.title}» добавлен в корзину`,
      {
        position: "bottom-right",
        autoClose: 2500,
        theme: "dark",
      }
    );

    closeModal();
  }

  return (
    <>
      <section
        className="product-list-section"
        id={slug}
      >
        <div className="product-list-heading">
          <h2 className="title">{title}</h2>
        </div>

        {products.length === 0 ? (
          <div className="product-list-empty">
            Товары пока не добавлены
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <Product
                key={product.id}
                open={() => openModal(product)}
                productId={product.id}
                title={product.title}
                price={product.price}
                description={product.description}
                photo={getImageUrl(product.image)}
              />
            ))}
          </div>
        )}
      </section>

      {isModalOpen && activeProduct && (
        <div
          className="product-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label={activeProduct.title}
        >
          <div
            className="product-modal-overlay"
            onClick={closeModal}
          />

          <section className="product-detail-modal">
            <button
              type="button"
              onClick={closeModal}
              className="product-detail-close"
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="product-detail-image">
              <img
                src={getImageUrl(activeProduct.image)}
                alt={activeProduct.title}
              />
            </div>

            <div className="product-detail-content">
              <div>
                <h2>{activeProduct.title}</h2>

                <p className="product-detail-price">
                  {formatPrice(activeProduct.price)} сум
                </p>

                {activeProduct.description && (
                  <p className="product-detail-description">
                    {activeProduct.description}
                  </p>
                )}
              </div>

              <div className="product-detail-footer">
                <div
                  className="product-detail-counter"
                  aria-label="Количество товара"
                >
                  <button
                    type="button"
                    onClick={decreaseCount}
                    aria-label="Уменьшить количество"
                  >
                    −
                  </button>

                  <span>{count}</span>

                  <button
                    type="button"
                    onClick={increaseCount}
                    aria-label="Увеличить количество"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  className="product-detail-add-button"
                >
                  В корзину ·{" "}
                  {formatPrice(
                    Number(activeProduct.price || 0) *
                      count
                  )}{" "}
                  сум
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <style>{`
        .product-list-section {
          scroll-margin-top: 100px;
          margin-bottom: 52px;
        }

        .product-list-heading {
          margin-bottom: 18px;
        }

        .product-list-heading .title {
          margin-bottom: 0 !important;
        }

        .product-list-empty {
          padding: 18px;
          border: 1px dashed var(--cream-deep);
          border-radius: var(--radius-s);
          background: rgba(255, 255, 255, .5);
          color: #8a7c6e;
          font-size: 13px;
          font-weight: 600;
        }

        .product-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .product-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(27, 21, 18, .67);
          backdrop-filter: blur(5px);
        }

        .product-detail-modal {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
          width: min(1000px, 100%);
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(27, 21, 18, .65);
          animation: product-detail-show .28s var(--ease-out);
        }

        @keyframes product-detail-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .product-detail-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
          display: grid;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 50%;
          background: rgba(27, 21, 18, .42);
          color: #fff;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          place-items: center;
          backdrop-filter: blur(5px);
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .product-detail-close:hover {
          background: var(--ember);
          transform: rotate(90deg);
        }

        .product-detail-image {
          display: grid;
          min-height: 420px;
          background: var(--cream);
          place-items: center;
        }

        .product-detail-image img {
          width: 100%;
          height: 100%;
          max-height: 610px;
          object-fit: cover;
        }

        .product-detail-content {
          display: flex;
          min-height: 420px;
          flex-direction: column;
          justify-content: space-between;
          padding: 34px;
        }

        .product-detail-content h2 {
          margin: 0 0 12px;
          color: var(--ink);
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 38px);
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .product-detail-price {
          margin: 0;
          color: var(--ember);
          font-family: var(--font-mono);
          font-size: 19px;
          font-weight: 600;
        }

        .product-detail-description {
          margin: 24px 0 0;
          color: #66584c;
          font-size: 14px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        .product-detail-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 34px;
        }

        .product-detail-counter {
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 12px;
          background: var(--cream);
        }

        .product-detail-counter button {
          display: grid;
          width: 42px;
          height: 46px;
          border: 0;
          background: transparent;
          color: var(--ink);
          cursor: pointer;
          font-size: 22px;
          font-weight: 700;
          place-items: center;
          transition:
            color .2s ease,
            background .2s ease;
        }

        .product-detail-counter button:hover {
          background: rgba(200, 30, 30, .08);
          color: var(--ember);
        }

        .product-detail-counter span {
          display: grid;
          min-width: 42px;
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 600;
          place-items: center;
        }

        .product-detail-add-button {
          min-height: 46px;
          flex: 1;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .product-detail-add-button:hover {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          transform: translateY(-2px);
        }

        body.dark-theme .product-list-empty {
          border-color: #45342b;
          background: #251b17;
          color: #bcae9d;
        }

        body.dark-theme .product-detail-modal {
          border-color: #45342b;
          background: #251b17;
        }

        body.dark-theme .product-detail-image {
          background: #342620;
        }

        body.dark-theme .product-detail-content h2 {
          color: #f8f3ea;
        }

        body.dark-theme .product-detail-description {
          color: #c7b9aa;
        }

        body.dark-theme .product-detail-counter {
          border-color: #4b362c;
          background: #342620;
        }

        body.dark-theme .product-detail-counter button,
        body.dark-theme .product-detail-counter span {
          color: #f8f3ea;
        }

        @media screen and (max-width: 760px) {
          .product-list-section {
            scroll-margin-top: 82px;
            margin-bottom: 36px;
          }

          .product-modal-root {
            padding: 0;
            align-items: end;
          }

          .product-detail-modal {
            display: flex;
            width: 100%;
            max-height: 92vh;
            flex-direction: column;
            overflow-y: auto;
            border-radius: 24px 24px 0 0;
          }

          .product-detail-image {
            min-height: auto;
            max-height: 310px;
          }

          .product-detail-image img {
            max-height: 310px;
            object-fit: cover;
          }

          .product-detail-content {
            min-height: auto;
            padding: 24px 20px;
          }

          .product-detail-content h2 {
            font-size: 27px;
          }

          .product-detail-footer {
            align-items: stretch;
            flex-direction: column;
            margin-top: 25px;
          }

          .product-detail-counter {
            justify-content: center;
          }

          .product-detail-add-button {
            min-height: 50px;
            flex: none;
          }
        }
      `}</style>
    </>
  );
}
