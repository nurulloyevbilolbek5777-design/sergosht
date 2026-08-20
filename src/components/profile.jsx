import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";

const API = "https://rest.sergosht-api.uz";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getFirstName(user) {
  return String(
    user?.firstName ||
      user?.first_name ||
      user?.name ||
      ""
  ).trim();
}

function getLastName(user) {
  return String(
    user?.lastName ||
      user?.last_name ||
      user?.surname ||
      ""
  ).trim();
}

function getFullName(user) {
  const firstName = getFirstName(user);
  const lastName = getLastName(user);

  return `${lastName} ${firstName}`.trim();
}

function getPhone(user) {
  return (
    user?.phone ||
    user?.phoneNumber ||
    user?.phone_number ||
    user?.mobile ||
    "Номер не указан"
  );
}

function getProducts(order) {
  if (Array.isArray(order?.products)) {
    return order.products;
  }

  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.order?.products)) {
    return order.order.products;
  }

  return [];
}

function getProductName(product) {
  return (
    product?.title ||
    product?.name ||
    product?.product?.title ||
    product?.product?.name ||
    "Товар"
  );
}

function getProductPrice(product) {
  return Number(
    product?.price ||
      product?.product?.price ||
      product?.amount ||
      0
  );
}

function getProductQuantity(product) {
  return Math.max(
    1,
    Number(
      product?.quantity ||
        product?.count ||
        product?.qty ||
        1
    )
  );
}

function getProductsTotal(order) {
  return getProducts(order).reduce((sum, product) => {
    return (
      sum +
      getProductPrice(product) *
        getProductQuantity(product)
    );
  }, 0);
}

function getDelivery(order) {
  const productsTotal = getProductsTotal(order);

  return productsTotal >= 100000 ? 0 : 10000;
}

function getOrderTotal(order) {
  const serverTotal = Number(
    order?.total ||
      order?.totalPrice ||
      order?.total_price ||
      0
  );

  if (serverTotal > 0) {
    return serverTotal;
  }

  return getProductsTotal(order) + getDelivery(order);
}

function getOrderDate(order) {
  return (
    order?.created_at ||
    order?.createdAt ||
    order?.date ||
    order?.created ||
    null
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function getStatusInfo(status) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (
    normalizedStatus.includes("достав") ||
    normalizedStatus.includes("готов") ||
    normalizedStatus.includes("заверш")
  ) {
    return {
      className: "is-success",
      label: status || "Готов",
    };
  }

  if (
    normalizedStatus.includes("отмен") ||
    normalizedStatus.includes("cancel")
  ) {
    return {
      className: "is-danger",
      label: status || "Отменён",
    };
  }

  if (
    normalizedStatus.includes("ожида") ||
    normalizedStatus.includes("обработ") ||
    normalizedStatus.includes("принят")
  ) {
    return {
      className: "is-warning",
      label: status || "В обработке",
    };
  }

  return {
    className: "is-primary",
    label: status || "Новый",
  };
}

function getOrdersList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = getStoredUser();

    setUser(savedUser);

    if (!savedUser?.token) {
      setError("Сначала войдите в аккаунт");
      setIsLoading(false);
      return;
    }

    loadOrders(savedUser, true);
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;

    function closeByEscape(event) {
      if (event.key === "Escape") {
        closeOrderModal();
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
  }, [selectedOrder]);

  const profileName = useMemo(() => {
    return getFullName(user) || "Пользователь";
  }, [user]);

  const firstLetter = useMemo(() => {
    return profileName.charAt(0).toUpperCase();
  }, [profileName]);

  async function loadOrders(savedUser, showLoader = false) {
    if (!savedUser?.token) return;

    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch(`${API}/api/order`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: savedUser.token,
        },
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

      const receivedOrders = getOrdersList(data);

      const newestOrdersFirst = [...receivedOrders].sort(
        (firstOrder, secondOrder) => {
          const firstDate = new Date(
            getOrderDate(firstOrder) || 0
          ).getTime();

          const secondDate = new Date(
            getOrderDate(secondOrder) || 0
          ).getTime();

          return secondDate - firstDate;
        }
      );

      setOrders(newestOrdersFirst);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.message ||
          "Не удалось загрузить историю заказов"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function closeOrderModal() {
    setSelectedOrder(null);
  }

  function refreshOrders() {
    const savedUser = getStoredUser();

    if (!savedUser?.token) {
      setError("Сначала войдите в аккаунт");
      return;
    }

    setUser(savedUser);
    loadOrders(savedUser, false);
  }

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-container">
        <nav
          className="profile-breadcrumb"
          aria-label="Навигация"
        >
          <NavLink to="/">Главная</NavLink>
          <span>/</span>
          <span className="is-current">Профиль</span>
        </nav>

        {!user?.token ? (
          <section className="profile-not-authorized">
            <h1>Профиль</h1>

            <p>Войдите в аккаунт, чтобы увидеть заказы.</p>

            <NavLink
              to="/"
              className="profile-primary-button"
            >
              Перейти в меню
            </NavLink>
          </section>
        ) : (
          <>
            <section className="profile-card">
              <div className="profile-avatar">
                {firstLetter}
              </div>

              <div className="profile-main-info">
                <h1>{profileName}</h1>

                <p>{getPhone(user)}</p>
              </div>

              <div className="profile-details">
                <div>
                  <span>Имя</span>
                  <strong>
                    {getFirstName(user) || "Не указано"}
                  </strong>
                </div>

                <div>
                  <span>Фамилия</span>
                  <strong>
                    {getLastName(user) || "Не указана"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="orders-section">
              <header className="orders-header">
                <h2>История заказов</h2>

                <button
                  type="button"
                  className={`orders-refresh ${
                    isRefreshing ? "is-spinning" : ""
                  }`}
                  onClick={refreshOrders}
                  disabled={isRefreshing || isLoading}
                  aria-label="Обновить заказы"
                  title="Обновить заказы"
                >
                  ↻
                </button>
              </header>

              {error && (
                <div className="orders-error">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="orders-grid">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="order-skeleton"
                    />
                  ))}
                </div>
              ) : !error && orders.length === 0 ? (
                <div className="orders-empty">
                  <h3>Заказов пока нет</h3>

                  <p>Первый заказ появится здесь.</p>

                  <NavLink
                    to="/"
                    className="profile-primary-button"
                  >
                    Перейти в меню
                  </NavLink>
                </div>
              ) : (
                <div className="orders-grid">
                  {orders.map((order, index) => {
                    const products = getProducts(order);
                    const productsTotal =
                      getProductsTotal(order);

                    const delivery = getDelivery(order);
                    const total = getOrderTotal(order);

                    const status = getStatusInfo(
                      order.status
                    );

                    const date = formatDate(
                      getOrderDate(order)
                    );

                    return (
                      <button
                        type="button"
                        className="order-card"
                        key={
                          order.id ||
                          order._id ||
                          `order-${index}`
                        }
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                      >
                        <div className="order-card-top">
                          <div>
                            <span className="order-number">
                              Заказ №{order.id || "—"}
                            </span>

                            {date && (
                              <time>{date}</time>
                            )}
                          </div>

                          <span
                            className={`order-status ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="order-address">
                          {order.address || "Адрес не указан"}
                        </p>

                        <div className="order-card-footer">
                          <span>
                            {products.length}{" "}
                            {products.length === 1
                              ? "товар"
                              : "товаров"}
                          </span>

                          <strong>
                            {formatPrice(total)} сум
                          </strong>
                        </div>

                        {delivery === 0 && (
                          <span className="order-delivery">
                            Бесплатная доставка
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedOrder && (
        <div
          className="order-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Детали заказа"
        >
          <div
            className="order-overlay"
            onClick={closeOrderModal}
          />

          <section className="order-modal">
            <header className="order-modal-head">
              <div>
                <span>Заказ</span>
                <h2>№{selectedOrder.id || "—"}</h2>
              </div>

              <button
                type="button"
                className="order-close"
                onClick={closeOrderModal}
                aria-label="Закрыть"
              >
                ×
              </button>
            </header>

            <div className="order-modal-body">
              <div className="order-info-grid">
                <div>
                  <span>Статус</span>

                  <strong
                    className={
                      getStatusInfo(
                        selectedOrder.status
                      ).className
                    }
                  >
                    {
                      getStatusInfo(
                        selectedOrder.status
                      ).label
                    }
                  </strong>
                </div>

                <div>
                  <span>Адрес</span>

                  <strong>
                    {selectedOrder.address ||
                      "Не указан"}
                  </strong>
                </div>
              </div>

              <h3>Состав заказа</h3>

              {getProducts(selectedOrder).length === 0 ? (
                <p className="order-no-products">
                  Список товаров не получен.
                </p>
              ) : (
                <div className="order-products">
                  {getProducts(selectedOrder).map(
                    (product, index) => {
                      const name =
                        getProductName(product);

                      const price =
                        getProductPrice(product);

                      const quantity =
                        getProductQuantity(product);

                      const productTotal =
                        price * quantity;

                      return (
                        <div
                          className="order-product"
                          key={
                            product.id ||
                            product.productId ||
                            `product-${index}`
                          }
                        >
                          <div>
                            <strong>{name}</strong>

                            <span>
                              {quantity} ×{" "}
                              {formatPrice(price)} сум
                            </span>
                          </div>

                          <b>
                            {formatPrice(productTotal)} сум
                          </b>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="order-calculation">
                <div>
                  <span>Товары</span>

                  <strong>
                    {formatPrice(
                      getProductsTotal(selectedOrder)
                    )}{" "}
                    сум
                  </strong>
                </div>

                <div>
                  <span>Доставка</span>

                  {getDelivery(selectedOrder) === 0 ? (
                    <strong className="is-success">
                      Бесплатно
                    </strong>
                  ) : (
                    <strong>
                      {formatPrice(
                        getDelivery(selectedOrder)
                      )}{" "}
                      сум
                    </strong>
                  )}
                </div>

                <div className="order-final-total">
                  <span>Итого</span>

                  <strong>
                    {formatPrice(
                      getOrderTotal(selectedOrder)
                    )}{" "}
                    сум
                  </strong>
                </div>
              </div>
            </div>

            <footer className="order-modal-foot">
              <button
                type="button"
                className="profile-secondary-button"
                onClick={closeOrderModal}
              >
                Закрыть
              </button>
            </footer>
          </section>
        </div>
      )}

      <style>{`
        .profile-page {
          --profile-ink: #211812;
          --profile-cream: #faf6ee;
          --profile-line: #e8dece;
          --profile-muted: #89796b;
          --profile-ember: #c81e1e;
          --profile-ember-light: #e8432f;
          --profile-gold: #c89b3c;
          --profile-gold-soft: #ead9ac;
          --profile-shadow: 0 16px 42px -28px rgba(52, 31, 14, .42);
          --profile-shadow-hover: 0 27px 58px -28px rgba(52, 31, 14, .48);

          min-height: 100vh;
          background: var(--profile-cream);
          color: var(--profile-ink);
        }

        .profile-container {
          width: min(1100px, calc(100% - 36px));
          margin: 0 auto;
          padding: 28px 0 80px;
        }

        .profile-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--profile-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .profile-breadcrumb a {
          color: var(--profile-muted);
          text-decoration: none;
          transition: color .2s ease;
        }

        .profile-breadcrumb a:hover {
          color: var(--profile-ember);
        }

        .profile-breadcrumb .is-current {
          color: var(--profile-ink);
        }

        .profile-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 18px;
          margin: 22px 0 38px;
          padding: 25px;
          border: 1px solid var(--profile-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--profile-shadow);
        }

        .profile-avatar {
          display: grid;
          width: 64px;
          height: 64px;
          border: 3px solid var(--profile-gold-soft);
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            var(--profile-ember-light),
            var(--profile-ember)
          );
          color: #fff;
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
          place-items: center;
        }

        .profile-main-info h1 {
          margin: 0 0 5px;
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: clamp(27px, 4vw, 36px);
          font-weight: 600;
          letter-spacing: -0.03em;
        }

        .profile-main-info p {
          margin: 0;
          color: var(--profile-muted);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
        }

        .profile-details {
          display: flex;
          gap: 28px;
        }

        .profile-details div {
          display: grid;
          gap: 4px;
        }

        .profile-details span {
          color: var(--profile-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .profile-details strong {
          color: var(--profile-ink);
          font-size: 13px;
        }

        .orders-section {
          margin-top: 10px;
        }

        .orders-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--profile-line);
        }

        .orders-header h2 {
          margin: 0;
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: clamp(27px, 4vw, 38px);
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .orders-refresh {
          display: grid;
          width: 46px;
          height: 46px;
          border: 1px solid var(--profile-line);
          border-radius: 50%;
          background: #fff;
          color: var(--profile-ink);
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            transform .2s ease,
            border-color .2s ease,
            color .2s ease;
        }

        .orders-refresh:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--profile-ember);
          transform: rotate(25deg);
        }

        .orders-refresh:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .orders-refresh.is-spinning {
          animation: profile-spin .8s linear infinite;
        }

        @keyframes profile-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .order-card {
          width: 100%;
          min-height: 190px;
          padding: 23px;
          border: 1px solid var(--profile-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--profile-shadow);
          color: var(--profile-ink);
          cursor: pointer;
          text-align: left;
          transition:
            transform .28s var(--ease-out),
            box-shadow .28s ease,
            border-color .28s ease;
        }

        .order-card:hover {
          border-color: rgba(200, 155, 60, .55);
          box-shadow: var(--profile-shadow-hover);
          transform: translateY(-4px);
        }

        .order-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .order-card-top > div {
          display: grid;
          gap: 5px;
        }

        .order-number {
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: 21px;
          font-weight: 600;
        }

        .order-card time {
          color: var(--profile-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .order-status {
          flex: 0 0 auto;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .03em;
        }

        .order-status.is-success,
        .is-success {
          background: #e8f5e9;
          color: #2f8650;
        }

        .order-status.is-danger,
        .is-danger {
          background: #fbeaea;
          color: #b32929;
        }

        .order-status.is-warning,
        .is-warning {
          background: #fff4d9;
          color: #9b6d00;
        }

        .order-status.is-primary,
        .is-primary {
          background: var(--profile-gold-soft);
          color: #725217;
        }

        .order-address {
          min-height: 42px;
          margin: 0 0 19px;
          color: #66584c;
          font-size: 13px;
          line-height: 1.6;
        }

        .order-card-footer {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin-top: auto;
          padding-top: 15px;
          border-top: 1px solid var(--profile-line);
        }

        .order-card-footer span {
          color: var(--profile-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .order-card-footer strong {
          color: var(--profile-ember);
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }

        .order-delivery {
          display: inline-block;
          margin-top: 10px;
          color: #2f8650;
          font-size: 11px;
          font-weight: 700;
        }

        .orders-empty,
        .profile-not-authorized {
          padding: 68px 22px;
          border: 1px dashed var(--profile-line);
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          text-align: center;
        }

        .orders-empty h3,
        .profile-not-authorized h1 {
          margin: 0 0 9px;
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
        }

        .orders-empty p,
        .profile-not-authorized p {
          margin: 0 0 22px;
          color: var(--profile-muted);
          font-size: 14px;
        }

        .profile-not-authorized {
          margin-top: 24px;
        }

        .profile-primary-button,
        .profile-secondary-button {
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

        .profile-primary-button {
          display: inline-grid;
          border: 0;
          background: linear-gradient(
            135deg,
            var(--profile-ember-light),
            var(--profile-ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
          place-items: center;
        }

        .profile-primary-button:hover {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          color: #fff;
          transform: translateY(-2px);
        }

        .profile-secondary-button {
          border: 1px solid var(--profile-line);
          background: #fff;
          color: var(--profile-muted);
        }

        .profile-secondary-button:hover {
          border-color: #cfc0ac;
          color: var(--profile-ink);
        }

        .orders-error {
          margin-bottom: 20px;
          padding: 13px 15px;
          border: 1px solid #efc9c9;
          border-radius: 12px;
          background: #fbeaea;
          color: #b32929;
          font-size: 13px;
          font-weight: 700;
        }

        .order-skeleton {
          min-height: 190px;
          border-radius: 20px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: profile-shimmer 1.2s ease infinite;
        }

        @keyframes profile-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .order-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .order-overlay {
          position: absolute;
          inset: 0;
          background: rgba(33, 24, 18, .6);
          backdrop-filter: blur(5px);
        }

        .order-modal {
          position: relative;
          width: min(640px, 100%);
          overflow: hidden;
          border: 1px solid var(--profile-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(33, 24, 18, .62);
          animation: order-modal-show .25s var(--ease-out);
        }

        @keyframes order-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .order-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--profile-line);
          background: #fffdf8;
        }

        .order-modal-head > div {
          display: grid;
          gap: 3px;
        }

        .order-modal-head span {
          color: var(--profile-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .order-modal-head h2 {
          margin: 0;
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
        }

        .order-close {
          display: grid;
          width: 36px;
          height: 36px;
          border: 1px solid var(--profile-line);
          border-radius: 50%;
          background: #fff;
          color: var(--profile-muted);
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            color .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .order-close:hover {
          border-color: rgba(200, 30, 30, .4);
          color: var(--profile-ember);
          transform: rotate(90deg);
        }

        .order-modal-body {
          max-height: 65vh;
          overflow-y: auto;
          padding: 23px 26px;
        }

        .order-info-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 12px;
          margin-bottom: 24px;
          padding: 14px;
          border: 1px solid var(--profile-line);
          border-radius: 14px;
          background: #fcf9f2;
        }

        .order-info-grid div {
          display: grid;
          gap: 5px;
        }

        .order-info-grid span {
          color: var(--profile-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .order-info-grid strong {
          color: var(--profile-ink);
          font-size: 13px;
          line-height: 1.5;
        }

        .order-modal-body h3 {
          margin: 0 0 14px;
          color: var(--profile-ink);
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 600;
        }

        .order-products {
          display: grid;
          gap: 9px;
        }

        .order-product {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 14px;
          border: 1px solid var(--profile-line);
          border-radius: 12px;
          background: #fff;
        }

        .order-product div {
          display: grid;
          min-width: 0;
          gap: 4px;
        }

        .order-product strong {
          overflow: hidden;
          color: var(--profile-ink);
          font-size: 14px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-product span {
          color: var(--profile-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .order-product b {
          flex: 0 0 auto;
          color: var(--profile-ember);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }

        .order-no-products {
          margin: 0;
          padding: 14px;
          border-radius: 12px;
          background: #fff4d9;
          color: #936800;
          font-size: 13px;
          font-weight: 600;
        }

        .order-calculation {
          display: grid;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--profile-line);
        }

        .order-calculation > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          color: #6d5f52;
          font-size: 13px;
        }

        .order-calculation strong {
          color: var(--profile-ink);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }

        .order-calculation .order-final-total {
          margin-top: 4px;
          padding-top: 15px;
          border-top: 1px solid var(--profile-line);
          color: var(--profile-ink);
          font-size: 15px;
          font-weight: 700;
        }

        .order-final-total strong {
          color: var(--profile-ember);
          font-size: 17px;
        }

        .order-modal-foot {
          display: flex;
          justify-content: flex-end;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--profile-line);
        }

        @media screen and (max-width: 760px) {
          .profile-container {
            width: calc(100% - 24px);
            padding-top: 18px;
          }

          .profile-card {
            grid-template-columns: auto 1fr;
            padding: 19px;
          }

          .profile-details {
            grid-column: 1 / -1;
            gap: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--profile-line);
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }

          .order-card {
            min-height: 175px;
            padding: 19px;
          }

          .order-modal-root {
            padding: 0;
            align-items: end;
          }

          .order-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .order-modal-body {
            max-height: 61vh;
            padding: 20px;
          }

          .order-modal-head,
          .order-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }

          .order-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
