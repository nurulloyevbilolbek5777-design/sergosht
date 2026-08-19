import { useEffect, useState } from "react";
import { NavLink } from "react-router";

const initialForm = {
  step: "phone",
  phone: "",
  code: "",
  firstName: "",
  lastName: "",
  error: "",
};

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getPhone(user) {
  return (
    user?.phone ||
    user?.phoneNumber ||
    user?.phone_number ||
    user?.mobile ||
    ""
  );
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("cart")) {
      localStorage.setItem("cart", "[]");
    }

    const savedUser = getUserFromStorage();
    setUser(savedUser);

    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((sum, item) => sum + (item.count || 1), 0);
      setCartCount(total);
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  function changeForm(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
      error: "",
    }));
  }

  function openLoginModal() {
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isLoading) return;

    setIsModalOpen(false);
    setForm(initialForm);
  }

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  }

  async function sendCode(event) {
    event.preventDefault();

    if (!form.phone.trim()) {
      changeForm("error", "Введите номер телефона");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://rest.sergosht-api.uz/api/send-verification-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: form.phone.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось отправить код");
      }

      setForm((previous) => ({
        ...previous,
        step: "code",
        error: "",
      }));
    } catch (error) {
      console.error(error);

      setForm((previous) => ({
        ...previous,
        error: "Не удалось отправить код",
      }));
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();

    if (!form.code.trim()) {
      changeForm("error", "Введите код из сообщения");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://rest.sergosht-api.uz/api/check-verification-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: form.phone.trim(),
            code: form.code.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.error) {
        throw new Error("Неверный код");
      }

      setForm((previous) => ({
        ...previous,
        step: "profile",
        error: "",
      }));

      const currentUser = {
        ...data,
        phone: getPhone(data) || form.phone.trim(),
      };

      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error(error);

      setForm((previous) => ({
        ...previous,
        error: "Неверный код или ошибка сервера",
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function saveProfile(event) {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      changeForm("error", "Имя и фамилия обязательны");
      return;
    }

    const savedUser = getUserFromStorage() || {};

    const updatedUser = {
      ...savedUser,
      phone: getPhone(savedUser) || form.phone.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    closeModal();
  }

  function renderError() {
    if (!form.error) return null;

    return <p className="help is-danger mt-2">{form.error}</p>;
  }

  return (
    <>
      <nav
        className="navbar is-danger"
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          <NavLink className="navbar-item" to="/">
            <img
              src="https://cdn.foodpicasso.com/assets/2023/07/06/eb22f9d7023be861993888ee788ed89d---png_original_919c8_convert.webp"
              alt="Логотип"
            />
          </NavLink>

          <button
            type="button"
            className={`navbar-burger ${
              isMenuOpen ? "is-active" : ""
            }`}
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((previous) => !previous)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? "is-active" : ""}`}>
          <div className="navbar-end">
            <div className="navbar-item">
  <button
      onClick={() => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
      }}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        marginRight: '10px',
        padding: '8px',
        borderRadius: '50%',
        transition: 'background 0.3s',
      }}
      className="theme-toggle"
    >
      🌙
    </button>
  </div>
  <div className="navbar-item">
    <NavLink to="/Basket" className="button is-danger is-light" style={{
      position: "relative",
      marginRight: "10px"
    }}>
                🛒 Корзина
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#fff",
                    color: "#C81E1E",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {cartCount}
                  </span>
                )}
              </NavLink>
            </div>
            <div className="navbar-item">
              {user ? (
                <button
                  type="button"
                  className="button is-danger is-light"
                  onClick={logout}
                >
                  Выйти
                </button>
              ) : (
                <button
                  type="button"
                  className="button is-primary"
                  onClick={openLoginModal}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={closeModal}></div>

          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                {form.step === "phone" && "Вход"}
                {form.step === "code" && "Введите код"}
                {form.step === "profile" && "Заполните профиль"}
              </p>

              <button
                type="button"
                className="delete"
                aria-label="Закрыть"
                onClick={closeModal}
              ></button>
            </header>

            {form.step === "phone" && (
              <form onSubmit={sendCode}>
                <section className="modal-card-body">
                  <label className="label" htmlFor="login-phone">
                    Номер телефона
                  </label>

                  <input
                    id="login-phone"
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      changeForm("phone", event.target.value)
                    }
                    placeholder="+998 90 123 45 67"
                    required
                  />

                  {renderError()}
                </section>

                <footer className="modal-card-foot">
                  <button
                    type="submit"
                    className={`button is-success ${
                      isLoading ? "is-loading" : ""
                    }`}
                    disabled={isLoading}
                  >
                    Получить код
                  </button>
                </footer>
              </form>
            )}

            {form.step === "code" && (
              <form onSubmit={verifyCode}>
                <section className="modal-card-body">
                  <p className="mb-3">
                    Код отправлен на номер: <strong>{form.phone}</strong>
                  </p>

                  <label className="label" htmlFor="verification-code">
                    Код из сообщения
                  </label>

                  <input
                    id="verification-code"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.code}
                    onChange={(event) =>
                      changeForm("code", event.target.value)
                    }
                    placeholder="Введите код"
                    required
                  />

                  {renderError()}
                </section>

                <footer className="modal-card-foot">
                  <button
                    type="submit"
                    className={`button is-success ${
                      isLoading ? "is-loading" : ""
                    }`}
                    disabled={isLoading}
                  >
                    Проверить код
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        step: "phone",
                        code: "",
                        error: "",
                      }))
                    }
                    disabled={isLoading}
                  >
                    Назад
                  </button>
                </footer>
              </form>
            )}

            {form.step === "profile" && (
              <form onSubmit={saveProfile}>
                <section className="modal-card-body">
                  <div className="field">
                    <label className="label" htmlFor="first-name">
                      Имя
                    </label>

                    <input
                      id="first-name"
                      className="input"
                      type="text"
                      value={form.firstName}
                      onChange={(event) =>
                        changeForm("firstName", event.target.value)
                      }
                      placeholder="Ваше имя"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="last-name">
                      Фамилия
                    </label>

                    <input
                      id="last-name"
                      className="input"
                      type="text"
                      value={form.lastName}
                      onChange={(event) =>
                        changeForm("lastName", event.target.value)
                      }
                      placeholder="Ваша фамилия"
                      required
                    />
                  </div>

                  {renderError()}
                </section>

                <footer className="modal-card-foot">
                  <button type="submit" className="button is-success">
                    Сохранить профиль
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
