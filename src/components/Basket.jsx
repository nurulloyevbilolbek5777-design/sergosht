import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";

const API = "https://rest.sergosht-api.uz";

const TOAST = {
  position: "bottom-right",
  autoClose: 3500,
  theme: "dark",
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getUserFirstName(user) {
  return String(
    user?.firstName ||
      user?.first_name ||
      user?.name ||
      ""
  ).trim();
}

function getUserLastName(user) {
  return String(
    user?.lastName ||
      user?.last_name ||
      user?.surname ||
      ""
  ).trim();
}

function getProductTitle(product) {
  return product?.title || product?.name || "Товар";
}

function getProductPrice(product) {
  return Number(product?.price || 0);
}

function getProductCount(product) {
  return Math.max(1, Number(product?.count || 1));
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function getProductWord(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "товаров";
  }

  if (last === 1) {
    return "товар";
  }

  if (last >= 2 && last <= 4) {
    return "товара";
  }

  return "товаров";
}

function getResponseError(data, status) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    `Ошибка сервера: ${status}`
  );
}

export default function Basket() {
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
  });

  useEffect(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      setCart(Array.isArray(savedCart) ? savedCart : []);
    } catch {
      localStorage.setItem("cart", "[]");
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (!isCheckoutOpen) return;

    function closeByEscape(event) {
      if (event.key === "Escape") {
        closeCheckout();
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
  }, [isCheckoutOpen, isSubmitting]);

  const totalQuantity = useMemo(() => {
    return cart.reduce(
      (sum, product) => sum + getProductCount(product),
      0
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, product) => {
      return (
        sum +
        getProductPrice(product) *
          getProductCount(product)
      );
    }, 0);
  }, [cart]);

  const delivery = subtotal >= 100000 ? 0 : 10000;
  const total = subtotal + delivery;

  function saveCart(newCart) {
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCart(newCart);

    window.dispatchEvent(new Event("storage"));
  }

  function changeCount(productId, change) {
    const product = cart.find(
      (item) => item.id === productId
    );

    if (!product) return;

    const currentCount = getProductCount(product);
    const nextCount = currentCount + change;

    if (nextCount < 1) {
      removeProduct(productId);
      return;
    }

    const newCart = cart.map((item) => {
      if (item.id === productId) {
        return {
          ...item,
          count: nextCount,
        };
      }

      return item;
    });

    saveCart(newCart);
  }

  function removeProduct(productId) {
    const product = cart.find(
      (item) => item.id === productId
    );

    const title = getProductTitle(product);

    const newCart = cart.filter(
      (item) => item.id !== productId
    );

    saveCart(newCart);

    toast.info(`«${title}» удалён из корзины`, TOAST);
  }

  function openCheckout() {
    const user = getStoredUser();

    if (!user?.id || !user?.token) {
      toast.warning(
        "Чтобы оформить заказ, сначала войдите в профиль",
        TOAST
      );

      return;
    }

    if (cart.length === 0) {
      toast.warning("В корзине нет товаров", TOAST);
      return;
    }

    setForm((previous) => ({
      ...previous,
      firstName:
        previous.firstName ||
        getUserFirstName(user),

      lastName:
        previous.lastName ||
        getUserLastName(user),
    }));

    setIsCheckoutOpen(true);
  }

  function closeCheckout() {
    if (isSubmitting) return;

    setIsCheckoutOpen(false);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();

    const user = getStoredUser();

    if (!user?.id || !user?.token) {
      toast.error(
        "Чтобы оформить заказ, сначала войдите в профиль",
        TOAST
      );

      setIsCheckoutOpen(false);
      return;
    }

    if (cart.length === 0) {
      toast.error("В корзине нет товаров", TOAST);
      return;
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.address.trim()
    ) {
      toast.error("Заполните все поля доставки", TOAST);
      return;
    }

    setIsSubmitting(true);

    try {
      const products = cart.map((product) => {
        const item = {
          ...product,
          quantity: getProductCount(product),
        };

        delete item.count;
        delete item.photo;
        delete item.title;
        delete item.name;
        delete item.description;

        return item;
      });

      const response = await fetch(`${API}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: user.token,
        },
        body: JSON.stringify({
          user,
          order: {
            user: user.id,
            products,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            address: form.address.trim(),
          },
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          getResponseError(data, response.status)
        );
      }

      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("storage"));

      setCart([]);

      setForm({
        firstName: "",
        lastName: "",
        address: "",
      });

      setIsCheckoutOpen(false);

      toast.success("Заказ принят", {
        position: "bottom-right",
        autoClose: 4500,
        theme: "dark",
      });
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Не удалось оформить заказ. Попробуйте ещё раз.",
        TOAST
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="basket-page">
      <Navbar />

      <main className="basket-container">
        <nav
          className="basket-breadcrumb"
          aria-label="Навигация"
        >
          <NavLink to="/">Главная</NavLink>
          <span>/</span>
          <span className="is-current">Корзина</span>
        </nav>

        <header className="basket-header">
          <div>
            <h1>Корзина</h1>

            {cart.length > 0 && (
              <p>
                {totalQuantity}{" "}
                {getProductWord(totalQuantity)}
              </p>
            )}
          </div>

          {cart.length > 0 && (
            <NavLink
              to="/"
              className="basket-menu-link"
            >
              Продолжить покупки
            </NavLink>
          )}
        </header>

        {cart.length === 0 ? (
          <section className="basket-empty">
            <div className="basket-empty-icon">🛒</div>

            <h2>Корзина пуста</h2>

            <p>Выберите блюда из меню.</p>

            <NavLink
              to="/"
              className="basket-primary-button"
            >
              Перейти в меню
            </NavLink>
          </section>
        ) : (
          <div className="basket-layout">
            <section className="basket-products">
              {cart.map((product) => {
                const title = getProductTitle(product);
                const price = getProductPrice(product);
                const count = getProductCount(product);
                const productTotal = price * count;

                return (
                  <article
                    className="basket-item"
                    key={product.id}
                  >
                    <div className="basket-image">
                      <img
                        src={product.photo}
                        alt={title}
                        loading="lazy"
                      />
                    </div>

                    <div className="basket-item-content">
                      <div className="basket-item-top">
                        <div>
                          <h2>{title}</h2>

                          <p className="basket-unit-price">
                            {formatPrice(price)} сум за шт.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="basket-remove"
                          onClick={() =>
                            removeProduct(product.id)
                          }
                          aria-label={`Удалить ${title}`}
                          title="Удалить"
                        >
                          ×
                        </button>
                      </div>

                      <div className="basket-item-bottom">
                        <div
                          className="basket-counter"
                          aria-label={`Количество товара ${title}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              changeCount(product.id, -1)
                            }
                            aria-label="Уменьшить количество"
                          >
                            −
                          </button>

                          <span>{count}</span>

                          <button
                            type="button"
                            onClick={() =>
                              changeCount(product.id, 1)
                            }
                            aria-label="Увеличить количество"
                          >
                            +
                          </button>
                        </div>

                        <strong className="basket-item-total">
                          {formatPrice(productTotal)} сум
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="basket-summary">
              <h2>Ваш заказ</h2>

              <div className="basket-summary-row">
                <span>Товары</span>

                <strong>
                  {formatPrice(subtotal)} сум
                </strong>
              </div>

              <div className="basket-summary-row">
                <span>Доставка</span>

                {delivery === 0 ? (
                  <strong className="basket-free">
                    Бесплатно
                  </strong>
                ) : (
                  <strong>
                    {formatPrice(delivery)} сум
                  </strong>
                )}
              </div>

              {delivery > 0 && (
                <p className="basket-delivery-note">
                  До бесплатной доставки осталось{" "}
                  {formatPrice(100000 - subtotal)} сум
                </p>
              )}

              <div className="basket-total-row">
                <span>Итого</span>

                <strong>
                  {formatPrice(total)} сум
                </strong>
              </div>

              <button
                type="button"
                className="basket-primary-button basket-checkout-button"
                onClick={openCheckout}
              >
                Оформить заказ
              </button>
            </aside>
          </div>
        )}
      </main>

      {isCheckoutOpen && (
        <div
          className="basket-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Оформление заказа"
        >
          <div
            className="basket-overlay"
            onClick={closeCheckout}
          />

          <form
            className="basket-modal"
            onSubmit={submitOrder}
          >
            <header className="basket-modal-head">
              <h2>Оформление заказа</h2>

              <button
                type="button"
                className="basket-close"
                onClick={closeCheckout}
                aria-label="Закрыть"
                disabled={isSubmitting}
              >
                ×
              </button>
            </header>

            <div className="basket-modal-body">
              <div className="basket-order-total">
                <span>К оплате</span>

                <strong>
                  {formatPrice(total)} сум
                </strong>
              </div>

              <div className="basket-form-grid">
                <label className="basket-field">
                  <span>Имя</span>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    placeholder="Ваше имя"
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label className="basket-field">
                  <span>Фамилия</span>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    placeholder="Ваша фамилия"
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>

              <label className="basket-field basket-address-field">
                <span>Адрес доставки</span>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Улица, дом, квартира"
                  autoComplete="street-address"
                  required
                />
              </label>
            </div>

            <footer className="basket-modal-foot">
              <button
                type="button"
                className="basket-secondary-button"
                onClick={closeCheckout}
                disabled={isSubmitting}
              >
                Отмена
              </button>

              <button
                type="submit"
                className="basket-primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Отправка..."
                  : "Подтвердить заказ"}
              </button>
            </footer>
          </form>
        </div>
      )}

      <ToastContainer />

      <style>{`
        .basket-page {
          --basket-ink: #211812;
          --basket-cream: #faf6ee;
          --basket-line: #e8dece;
          --basket-muted: #89796b;
          --basket-ember: #c81e1e;
          --basket-ember-light: #e8432f;
          --basket-gold: #c89b3c;
          --basket-gold-soft: #ead9ac;
          --basket-shadow: 0 16px 42px -28px rgba(52, 31, 14, .42);
          --basket-shadow-hover: 0 27px 58px -28px rgba(52, 31, 14, .48);

          min-height: 100vh;
          background: var(--basket-cream);
          color: var(--basket-ink);
        }

        .basket-container {
          width: min(1120px, calc(100% - 36px));
          margin: 0 auto;
          padding: 28px 0 80px;
        }

        .basket-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--basket-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .basket-breadcrumb a {
          color: var(--basket-muted);
          text-decoration: none;
          transition: color .2s ease;
        }

        .basket-breadcrumb a:hover {
          color: var(--basket-ember);
        }

        .basket-breadcrumb .is-current {
          color: var(--basket-ink);
        }

        .basket-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin: 22px 0 30px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--basket-line);
        }

        .basket-header h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .basket-header p {
          margin: 10px 0 0;
          color: var(--basket-muted);
          font-size: 14px;
          font-weight: 600;
        }

        .basket-menu-link {
          color: var(--basket-ember);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .basket-menu-link:hover {
          text-decoration: underline;
        }

        .basket-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          align-items: start;
          gap: 28px;
        }

        .basket-products {
          display: grid;
          gap: 16px;
        }

        .basket-item {
          display: flex;
          gap: 18px;
          padding: 16px;
          border: 1px solid var(--basket-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--basket-shadow);
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .basket-item:hover {
          border-color: rgba(200, 155, 60, .55);
          box-shadow: var(--basket-shadow-hover);
          transform: translateY(-3px);
        }

        .basket-image {
          flex: 0 0 auto;
          width: 112px;
          height: 112px;
          overflow: hidden;
          border-radius: 14px;
          background: #f1e8da;
        }

        .basket-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .basket-item-content {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-width: 0;
        }

        .basket-item-top,
        .basket-item-bottom {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .basket-item-top h2 {
          overflow: hidden;
          margin: 0 0 5px;
          color: var(--basket-ink);
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .basket-unit-price {
          margin: 0;
          color: var(--basket-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .basket-remove {
          display: grid;
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border: 1px solid var(--basket-line);
          border-radius: 50%;
          background: #fff;
          color: var(--basket-muted);
          cursor: pointer;
          font-size: 21px;
          line-height: 1;
          place-items: center;
          transition:
            color .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .basket-remove:hover {
          border-color: rgba(200, 30, 30, .4);
          color: var(--basket-ember);
          transform: rotate(90deg);
        }

        .basket-item-bottom {
          align-items: center;
          margin-top: auto;
          padding-top: 16px;
        }

        .basket-counter {
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid var(--basket-line);
          border-radius: 10px;
          background: #fcf9f2;
        }

        .basket-counter button {
          display: grid;
          width: 36px;
          height: 36px;
          border: 0;
          background: transparent;
          color: var(--basket-ink);
          cursor: pointer;
          font-size: 20px;
          font-weight: 700;
          place-items: center;
          transition:
            color .2s ease,
            background .2s ease;
        }

        .basket-counter button:hover {
          background: rgba(200, 30, 30, .08);
          color: var(--basket-ember);
        }

        .basket-counter span {
          display: grid;
          min-width: 36px;
          color: var(--basket-ink);
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          place-items: center;
        }

        .basket-item-total {
          color: var(--basket-ember);
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 600;
          text-align: right;
        }

        .basket-summary {
          position: sticky;
          top: 100px;
          padding: 24px;
          border: 1px solid var(--basket-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--basket-shadow);
        }

        .basket-summary h2 {
          margin: 0 0 22px;
          color: var(--basket-ink);
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 600;
        }

        .basket-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
          color: #6d5f52;
          font-size: 14px;
        }

        .basket-summary-row strong {
          color: var(--basket-ink);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }

        .basket-summary-row .basket-free {
          color: #2f8650;
        }

        .basket-delivery-note {
          margin: 2px 0 18px;
          padding: 10px 11px;
          border-radius: 10px;
          background: #fcf9f2;
          color: var(--basket-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .basket-total-row {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin: 20px 0;
          padding-top: 18px;
          border-top: 1px solid var(--basket-line);
        }

        .basket-total-row span {
          color: var(--basket-ink);
          font-size: 15px;
          font-weight: 700;
        }

        .basket-total-row strong {
          color: var(--basket-ember);
          font-family: var(--font-mono);
          font-size: 19px;
          font-weight: 600;
          text-align: right;
        }

        .basket-primary-button,
        .basket-secondary-button {
          min-height: 46px;
          border-radius: 999px;
          padding: 0 22px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .basket-primary-button {
          display: inline-grid;
          border: 0;
          background: linear-gradient(
            135deg,
            var(--basket-ember-light),
            var(--basket-ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
          place-items: center;
        }

        .basket-primary-button:hover:not(:disabled) {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          color: #fff;
          transform: translateY(-2px);
        }

        .basket-secondary-button {
          border: 1px solid var(--basket-line);
          background: #fff;
          color: var(--basket-muted);
        }

        .basket-secondary-button:hover:not(:disabled) {
          border-color: #cfc0ac;
          color: var(--basket-ink);
        }

        .basket-primary-button:disabled,
        .basket-secondary-button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .basket-checkout-button {
          width: 100%;
        }

        .basket-empty {
          padding: 70px 20px;
          border: 1px dashed var(--basket-line);
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          text-align: center;
        }

        .basket-empty-icon {
          display: grid;
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: #f2e7d5;
          font-size: 27px;
          place-items: center;
        }

        .basket-empty h2 {
          margin: 0 0 8px;
          color: var(--basket-ink);
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
        }

        .basket-empty p {
          margin: 0 0 22px;
          color: var(--basket-muted);
          font-size: 14px;
        }

        .basket-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .basket-overlay {
          position: absolute;
          inset: 0;
          background: rgba(33, 24, 18, .6);
          backdrop-filter: blur(5px);
        }

        .basket-modal {
          position: relative;
          width: min(600px, 100%);
          overflow: hidden;
          border: 1px solid var(--basket-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(33, 24, 18, .62);
          animation: basket-modal-show .25s var(--ease-out);
        }

        @keyframes basket-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .basket-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--basket-line);
          background: #fffdf8;
        }

        .basket-modal-head h2 {
          margin: 0;
          color: var(--basket-ink);
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 600;
        }

        .basket-close {
          display: grid;
          width: 36px;
          height: 36px;
          border: 1px solid var(--basket-line);
          border-radius: 50%;
          background: #fff;
          color: var(--basket-muted);
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            color .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .basket-close:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--basket-ember);
          transform: rotate(90deg);
        }

        .basket-modal-body {
          padding: 23px 26px;
        }

        .basket-order-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          padding: 13px 14px;
          border-left: 3px solid var(--basket-ember);
          border-radius: 8px;
          background: #fcf9f2;
        }

        .basket-order-total span {
          color: var(--basket-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .basket-order-total strong {
          color: var(--basket-ember);
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 600;
        }

        .basket-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .basket-field {
          display: block;
        }

        .basket-field > span {
          display: block;
          margin-bottom: 8px;
          color: #6d5f52;
          font-size: 12px;
          font-weight: 700;
        }

        .basket-field input,
        .basket-field textarea {
          width: 100%;
          border: 1px solid var(--basket-line);
          border-radius: 12px;
          outline: none;
          background: #fcf9f2;
          color: var(--basket-ink);
          font-family: var(--font-body);
          font-size: 14px;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .basket-field input {
          height: 46px;
          padding: 0 13px;
        }

        .basket-field textarea {
          min-height: 105px;
          padding: 13px;
          line-height: 1.6;
          resize: vertical;
        }

        .basket-field input:focus,
        .basket-field textarea:focus {
          border-color: rgba(200, 155, 60, .8);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(200, 155, 60, .14);
        }

        .basket-address-field {
          margin-top: 16px;
        }

        .basket-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--basket-line);
        }

        @media screen and (max-width: 900px) {
          .basket-layout {
            grid-template-columns: 1fr;
          }

          .basket-summary {
            position: static;
          }
        }

        @media screen and (max-width: 650px) {
          .basket-container {
            width: calc(100% - 24px);
            padding-top: 18px;
          }

          .basket-header {
            align-items: stretch;
            flex-direction: column;
          }

          .basket-item {
            gap: 13px;
            padding: 13px;
          }

          .basket-image {
            width: 82px;
            height: 82px;
          }

          .basket-item-top h2 {
            font-size: 17px;
          }

          .basket-unit-price {
            font-size: 11px;
          }

          .basket-item-bottom {
            align-items: flex-end;
            flex-direction: column;
            gap: 10px;
            padding-top: 10px;
          }

          .basket-item-total {
            font-size: 13px;
          }

          .basket-modal-root {
            padding: 0;
            align-items: end;
          }

          .basket-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .basket-modal-body {
            max-height: 62vh;
            overflow-y: auto;
            padding: 20px;
          }

          .basket-modal-head,
          .basket-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }

          .basket-form-grid {
            grid-template-columns: 1fr;
          }

          .basket-modal-foot .basket-primary-button,
          .basket-modal-foot .basket-secondary-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
