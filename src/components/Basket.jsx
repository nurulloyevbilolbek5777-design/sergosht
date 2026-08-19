import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  function getUser() {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      return user && user.id ? user : null;
    } catch {
      return null;
    }
  }

  function saveCart(newCart) {
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCart(newCart);
  }

  function plusCount(productId) {
    const product = cart.find(
      (item) => item.id === productId
    );

    if (!product) return;

    const title = product.title || product.name || "Товар";
    const newCount = product.count + 1;

    const newCart = cart.map((item) => {
      if (item.id === productId) {
        return {
          ...item,
          count: newCount,
        };
      }

      return item;
    });

    saveCart(newCart);

    toast.success(
      newCount === 1
        ? `Товар «${title}» добавлен в корзину`
        : `В корзине ${newCount} ${getProductWord(
            newCount
          )} «${title}»`,
      {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      }
    );
  }

  function minusCount(productId) {
    const product = cart.find(
      (item) => item.id === productId
    );

    if (!product) return;

    const title = product.title || product.name || "Товар";

    if (product.count === 1) {
      const newCart = cart.filter(
        (item) => item.id !== productId
      );

      saveCart(newCart);

      toast.error(
        `Товар «${title}» полностью удалён из корзины`,
        {
          position: "bottom-right",
          autoClose: 3000,
          theme: "dark",
        }
      );

      return;
    }

    const newCount = product.count - 1;

    const newCart = cart.map((item) => {
      if (item.id === productId) {
        return {
          ...item,
          count: newCount,
        };
      }

      return item;
    });

    saveCart(newCart);

    toast.warning(
      `В корзине осталось ${newCount} ${getProductWord(
        newCount
      )} «${title}»`,
      {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      }
    );
  }

  function getProductWord(count) {
    if (count === 1) return "товар";
    if (count >= 2 && count <= 4) return "товара";
    return "товаров";
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCheckoutForm() {
    if (!getUser()) {
      toast.error(
        "Чтобы оформить заказ, сначала войдите в аккаунт",
        {
          position: "bottom-right",
          autoClose: 4000,
          theme: "dark",
        }
      );

      return;
    }

    setShowForm(true);
  }

  function closeCheckoutForm() {
    if (isSubmitting) return;

    setShowForm(false);
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!getUser()) {
      toast.error(
        "Чтобы оформить заказ, сначала войдите в аккаунт",
        {
          position: "bottom-right",
          autoClose: 4000,
          theme: "dark",
        }
      );

      setShowForm(false);
      return;
    }

    if (cart.length === 0) {
      toast.error("В корзине нет товаров", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });

      return;
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.address.trim()
    ) {
      toast.error("Пожалуйста, заполните все поля", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const products = cart.map((element) => {
        const item = { ...element };

        item.quantity = item.count;

        delete item.count;
        delete item.photo;
        delete item.title;
        delete item.description;

        return item;
      });

      const response = await fetch(
        "https://rest.sergosht-api.uz/api/order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        }
      );

      if (!response.ok) {
        throw new Error("Order request failed");
      }

      toast.success(
        "Ваш заказ успешно принят. Спасибо за покупку!",
        {
          position: "bottom-right",
          autoClose: 5000,
          theme: "dark",
        }
      );

      localStorage.setItem("cart", "[]");

      setCart([]);
      setForm({
        firstName: "",
        lastName: "",
        address: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error(error);

      toast.error(
        "Не удалось оформить заказ. Попробуйте ещё раз.",
        {
          position: "bottom-right",
          autoClose: 4000,
          theme: "dark",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * product.count,
    0
  );

  const delivery = total >= 100000 ? 0 : 10000;
  const finalTotal = total + delivery;

  return (
    <div>
      <Navbar />

      <div className="container mt-5 mb-6">
        <div className="content">
          <h1 className="title mb-5">
            Корзина
          </h1>

          {cart.length === 0 ? (
            <div className="box has-text-centered py-6">
              <p
                style={{
                  fontSize: "64px",
                  marginBottom: "15px",
                }}
              >
                🛒
              </p>

              <h2 className="title is-4">
                В вашей корзине пока нет товаров
              </h2>

              <p className="has-text-grey mb-5">
                Перейдите в меню и выберите понравившиеся блюда.
              </p>

              <NavLink
                to="/"
                className="button is-danger is-medium"
              >
                Перейти в меню
              </NavLink>
            </div>
          ) : (
            <>
              {cart.map((product) => {
                const title =
                  product.title || product.name || "Товар";

                const price = Number(product.price || 0);
                const productTotal =
                  price * product.count;

                return (
                  <div
                    className="card mb-5"
                    key={product.id}
                    style={{
                      borderRadius: "14px",
                      boxShadow:
                        "0 5px 18px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <div className="card-content">
                      <div className="media">
                        <div className="media-left">
                          <figure className="image is-96x96">
                            <img
                              src={product.photo}
                              alt={title}
                              style={{
                                width: "96px",
                                height: "96px",
                                objectFit: "cover",
                                borderRadius: "10px",
                              }}
                            />
                          </figure>
                        </div>

                        <div className="media-content">
                          <div className="is-flex is-justify-content-space-between is-align-items-start">
                            <p className="title is-4 mb-2">
                              {title}
                            </p>

                            <strong className="has-text-primary">
                              {productTotal.toLocaleString()} сум
                            </strong>
                          </div>

                          <p className="has-text-grey mb-4">
                            Цена за 1 шт.:{" "}
                            {price.toLocaleString()} сум
                          </p>

                          <div className="is-flex is-align-items-center">
                            <button
                              type="button"
                              className="button is-danger is-light"
                              onClick={() =>
                                minusCount(product.id)
                              }
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "9px",
                                fontSize: "22px",
                                fontWeight: "700",
                                padding: 0,
                              }}
                            >
                              −
                            </button>

                            <span
                              style={{
                                minWidth: "48px",
                                textAlign: "center",
                                fontSize: "18px",
                                fontWeight: "700",
                              }}
                            >
                              {product.count}
                            </span>

                            <button
                              type="button"
                              className="button is-danger"
                              onClick={() =>
                                plusCount(product.id)
                              }
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "9px",
                                fontSize: "22px",
                                fontWeight: "700",
                                padding: 0,
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                className="box mt-5"
                style={{
                  maxWidth: "500px",
                  marginLeft: "auto",
                  borderRadius: "14px",
                }}
              >
                <h2 className="title is-4">
                  Ваш заказ
                </h2>

                <div className="is-flex is-justify-content-space-between mb-3">
                  <span>Товары:</span>

                  <strong>
                    {total.toLocaleString()} сум
                  </strong>
                </div>

                <div className="is-flex is-justify-content-space-between mb-3">
                  <span>Доставка:</span>

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

                <div className="is-flex is-justify-content-space-between is-size-4">
                  <strong>Итого:</strong>

                  <strong className="has-text-primary">
                    {finalTotal.toLocaleString()} сум
                  </strong>
                </div>
              </div>
            </>
          )}

          {cart.length > 0 && (
            <button
              type="button"
              className="button is-danger is-medium mt-4"
              onClick={openCheckoutForm}
            >
              Оформить заказ
            </button>
          )}

          {showForm && (
            <div
              className="box mt-5"
              style={{
                maxWidth: "500px",
                borderRadius: "14px",
              }}
            >
              <h2 className="title is-4">
                Данные для доставки
              </h2>

              <form
                onSubmit={submitOrder}
                autoComplete="off"
              >
                <div className="field">
                  <label
                    className="label"
                    htmlFor="firstName"
                  >
                    Имя
                  </label>

                  <input
                    id="firstName"
                    className="input"
                    type="text"
                    name="firstName"
                    autoComplete="off"
                    value={form.firstName}
                    onChange={handleFormChange}
                    placeholder="Введите имя"
                    required
                  />
                </div>

                <div className="field">
                  <label
                    className="label"
                    htmlFor="lastName"
                  >
                    Фамилия
                  </label>

                  <input
                    id="lastName"
                    className="input"
                    type="text"
                    name="lastName"
                    autoComplete="off"
                    value={form.lastName}
                    onChange={handleFormChange}
                    placeholder="Введите фамилию"
                    required
                  />
                </div>

                <div className="field">
                  <label
                    className="label"
                    htmlFor="address"
                  >
                    Адрес доставки
                  </label>

                  <input
                    id="address"
                    className="input"
                    type="text"
                    name="address"
                    autoComplete="off"
                    value={form.address}
                    onChange={handleFormChange}
                    placeholder="Введите адрес доставки"
                    required
                  />
                </div>

                <div className="buttons mt-4">
                  <button
                    type="submit"
                    className={`button is-danger ${
                      isSubmitting ? "is-loading" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Отправляем заказ..."
                      : "Подтвердить заказ"}
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={closeCheckoutForm}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}