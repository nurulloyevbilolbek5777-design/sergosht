import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getProducts(order) {
  if (Array.isArray(order.products)) {
    return order.products;
  }

  if (Array.isArray(order.items)) {
    return order.items;
  }

  if (Array.isArray(order.order?.products)) {
    return order.order.products;
  }

  return [];
}

function getProductName(product) {
  return (
    product.title ||
    product.name ||
    product.product?.title ||
    product.product?.name ||
    "Товар"
  );
}

function getProductPrice(product) {
  return Number(
    product.price ||
      product.product?.price ||
      product.amount ||
      0
  );
}

function getProductQuantity(product) {
  return Number(
    product.quantity ||
      product.count ||
      product.qty ||
      1
  );
}

function getProductsTotal(order) {
  return getProducts(order).reduce((sum, product) => {
    const price = getProductPrice(product);
    const quantity = getProductQuantity(product);

    return sum + price * quantity;
  }, 0);
}

function getOrderTotal(order) {
  const serverTotal = Number(
    order.total ||
      order.totalPrice ||
      order.total_price ||
      0
  );

  if (serverTotal > 0) {
    return serverTotal;
  }

  const productsTotal = getProductsTotal(order);
  const delivery = productsTotal >= 100000 ? 0 : 10000;

  return productsTotal + delivery;
}

function getDelivery(order) {
  const productsTotal = getProductsTotal(order);

  return productsTotal >= 100000 ? 0 : 10000;
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (
    normalizedStatus.includes("достав") ||
    normalizedStatus.includes("готов")
  ) {
    return "is-success";
  }

  if (normalizedStatus.includes("отмен")) {
    return "is-danger";
  }

  if (
    normalizedStatus.includes("ожида") ||
    normalizedStatus.includes("обработ")
  ) {
    return "is-warning";
  }

  return "is-primary";
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = getStoredUser();

    setUser(savedUser);

    if (!savedUser?.token) {
      setError("Сначала войдите в аккаунт");
      setIsLoading(false);
      return;
    }

    async function loadOrders() {
      try {
        const response = await fetch(
          "https://rest.sergosht-api.uz/api/order",
          {
            method: "GET",
            headers: {
              Authorization: savedUser.token,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить заказы");
        }

        const data = await response.json();

        const receivedOrders = Array.isArray(data)
          ? data
          : data.orders || data.data || [];

        setOrders(
          Array.isArray(receivedOrders)
            ? receivedOrders
            : []
        );
      } catch (requestError) {
        console.error(requestError);
        setError("Не удалось загрузить историю заказов");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  const phone = useMemo(
    () =>
      user?.phone ||
      user?.phoneNumber ||
      user?.phone_number ||
      user?.mobile ||
      "Номер не указан",
    [user]
  );

  function closeOrderModal() {
    setSelectedOrder(null);
  }

  return (
    <div>
      <Navbar />

      <main className="container mt-5 mb-6">
        <nav className="breadcrumb" aria-label="breadcrumbs">
          <ul>
            <li>
              <NavLink to="/">Главная</NavLink>
            </li>
          </ul>
        </nav>

        <section className="box mb-6">
          <h1 className="title">Профиль</h1>

          {!user ? (
            <div className="notification is-warning">
              Сначала войдите в аккаунт.
            </div>
          ) : (
            <div className="columns is-multiline">
              <div className="column is-4">
                <p className="heading">Имя</p>

                <p className="is-size-5 has-text-weight-semibold">
                  {user.firstName ||
                    user.first_name ||
                    user.name ||
                    "Не указано"}
                </p>
              </div>

              <div className="column is-4">
                <p className="heading">Фамилия</p>

                <p className="is-size-5 has-text-weight-semibold">
                  {user.lastName ||
                    user.last_name ||
                    user.surname ||
                    "Не указана"}
                </p>
              </div>

              <div className="column is-4">
                <p className="heading">Телефон</p>

                <p className="is-size-5 has-text-weight-semibold">
                  {phone}
                </p>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="title is-3">
            История заказов
          </h2>

          {error && (
            <div className="notification is-danger">
              {error}
            </div>
          )}

          {!isLoading &&
            !error &&
            orders.length === 0 && (
              <div className="box has-text-centered py-6">

                <h3 className="title is-4">
                  У вас пока нет заказов
                </h3>

                <p className="has-text-grey mb-5">
                  Перейдите в меню и выберите товары.
                </p>

                <NavLink
                  to="/"
                  className="button is-danger is-medium"
                >
                  Перейти в меню
                </NavLink>
              </div>
            )}

          <div className="columns is-multiline">
            {orders.map((order) => {
              const productsTotal = getProductsTotal(order);
              const delivery = getDelivery(order);
              const total = getOrderTotal(order);

              return (
                <div
                  className="column is-6"
                  key={order.id}
                >
                  <button
                    type="button"
                    className="card order-card"
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      width: "100%",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "14px",
                      boxShadow:
                        "0 5px 18px rgba(187, 14, 14, 0.10)",
                    }}
                  >
                    <div className="card-content">
                      <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
                        <p className="title is-5 mb-0">
                          Заказ №{order.id}
                        </p>

                        <span
                          className={`tag ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status || "Не указан"}
                        </span>
                      </div>

                      <p className="mb-3">
                        <strong>Адрес:</strong>{" "}
                        {order.address || "Не указан"}
                      </p>

                      <hr />

                      <div className="is-flex is-justify-content-space-between">
                        <strong>Товары:</strong>

                        <strong>
                          {productsTotal.toLocaleString()} сум
                        </strong>
                      </div>

                      <div className="is-flex is-justify-content-space-between mt-2">
                        <strong>Доставка:</strong>

                        {delivery === 0 ? (
                          <strong className="has-text-success">
                            Бесплатно
                          </strong>
                        ) : (
                          <strong>
                            {delivery.toLocaleString()} сум
                          </strong>
                        )}
                      </div>

                      <hr />

                      <div className="is-flex is-justify-content-space-between">
                        <strong>Итого:</strong>

                        <strong className="has-text-primary">
                          {total.toLocaleString()} сум
                        </strong>
                      </div>

                      {delivery === 0 && (
                        <p className="has-text-success mt-2">
                          Бесплатная доставка
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {selectedOrder && (
        <div className="modal is-active">
          <div
            className="modal-background"
            onClick={closeOrderModal}
          ></div>

          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                Детали заказа №{selectedOrder.id}
              </p>
            </header>

            <section className="modal-card-body">
              <div className="columns is-multiline">
                <div className="column is-6">
                  <strong>Статус:</strong>{" "}
                  {selectedOrder.status || "Не указан"}
                </div>

                <div className="column is-6">
                  <strong>Адрес:</strong>{" "}
                  {selectedOrder.address || "Не указан"}
                </div>
              </div>

              <hr />

              <h3 className="title is-5">
                Состав заказа
              </h3>

              {getProducts(selectedOrder).length === 0 ? (
                <div className="notification is-warning is-light">
                  Сервер не передал список товаров для этого заказа.
                </div>
              ) : (
                getProducts(selectedOrder).map(
                  (product, index) => {
                    const name = getProductName(product);
                    const price = getProductPrice(product);
                    const quantity =
                      getProductQuantity(product);
                    const productTotal =
                      price * quantity;

                    return (
                      <div
                        className="box mb-3"
                        key={
                          product.id ||
                          product.productId ||
                          index
                        }
                      >
                        <div className="is-flex is-justify-content-space-between is-align-items-center">
                          <strong>{name}</strong>

                          <strong className="has-text-primary">
                            {productTotal.toLocaleString()} сум
                          </strong>
                        </div>

                        <p className="has-text-grey mt-2">
                          {quantity} ×{" "}
                          {price.toLocaleString()} сум
                        </p>
                      </div>
                    );
                  }
                )
              )}

              <hr />

              <div className="is-flex is-justify-content-space-between">
                <strong>Товары:</strong>

                <strong>
                  {getProductsTotal(
                    selectedOrder
                  ).toLocaleString()}{" "}
                  сум
                </strong>
              </div>

              <div className="is-flex is-justify-content-space-between mt-2">
                <strong>Доставка:</strong>

                {getDelivery(selectedOrder) ===
                0 ? (
                  <strong className="has-text-success">
                    Бесплатно
                  </strong>
                ) : (
                  <strong>
                    {getDelivery(
                      selectedOrder
                    ).toLocaleString()}{" "}
                    сум
                  </strong>
                )}
              </div>

              <hr />

              <div className="is-flex is-justify-content-space-between is-size-4">
                <strong>Итого:</strong>

                <strong className="has-text-primary">
                  {getOrderTotal(
                    selectedOrder
                  ).toLocaleString()}{" "}
                  сум
                </strong>
              </div>

              {getDelivery(selectedOrder) ===
                0 && (
                <p className="has-text-success mt-3">
                   Бесплатная доставка
                </p>
              )}
            </section>

            <footer className="modal-card-foot">
              <button
                type="button"
                className="button"
                onClick={closeOrderModal}
              >
                Закрыть
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
