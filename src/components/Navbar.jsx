import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";

const API = "https://rest.sergosht-api.uz";

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

function getShortUserName(user) {
  const firstName = getFirstName(user);
  const lastName = getLastName(user);

  if (lastName && firstName) {
    return `${lastName}.${firstName.charAt(0).toUpperCase()}`;
  }

  if (lastName) {
    return lastName;
  }

  if (firstName) {
    return firstName;
  }

  return "Профиль";
}

function getUserInitial(user) {
  const firstName = getFirstName(user);
  const lastName = getLastName(user);

  return (
    lastName.charAt(0).toUpperCase() ||
    firstName.charAt(0).toUpperCase() ||
    "П"
  );
}

function getCartCount() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    if (!Array.isArray(cart)) {
      return 0;
    }

    return cart.reduce((sum, item) => {
      return sum + Math.max(1, Number(item.count || 1));
    }, 0);
  } catch {
    return 0;
  }
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

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const [form, setForm] = useState(initialForm);

  const profileRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("cart")) {
      localStorage.setItem("cart", "[]");
    }

    const savedUser = getUserFromStorage();
    const savedTheme =
      localStorage.getItem("darkTheme") === "true";

    setUser(savedUser);
    setCartCount(getCartCount());
    setIsDarkTheme(savedTheme);

    if (savedTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    function updateCart() {
      setCartCount(getCartCount());
    }

    function updateUser() {
      setUser(getUserFromStorage());
    }

    window.addEventListener("storage", updateCart);
    window.addEventListener("cart-updated", updateCart);
    window.addEventListener("user-updated", updateUser);

    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("cart-updated", updateCart);
      window.removeEventListener(
        "user-updated",
        updateUser
      );
    };
  }, []);

  useEffect(() => {
    function closeProfileByOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeProfileByOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeProfileByOutsideClick
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
  }, [isModalOpen, isLoading]);

  function changeForm(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
      error: "",
    }));
  }

  function openLoginModal() {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isLoading) return;

    setIsModalOpen(false);
    setForm(initialForm);
  }

  function toggleTheme() {
    const nextTheme = !isDarkTheme;

    setIsDarkTheme(nextTheme);

    if (nextTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    localStorage.setItem(
      "darkTheme",
      String(nextTheme)
    );
  }

  function toggleProfileMenu() {
    setIsProfileOpen((previous) => !previous);
  }

  function logout() {
    localStorage.removeItem("user");

    setUser(null);
    setIsProfileOpen(false);
    setIsMenuOpen(false);

    window.dispatchEvent(new Event("user-updated"));
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
        `${API}/api/send-verification-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            phone: form.phone.trim(),
          }),
        }
      );

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

      setForm((previous) => ({
        ...previous,
        step: "code",
        error: "",
      }));
    } catch (error) {
      console.error(error);

      setForm((previous) => ({
        ...previous,
        error:
          error.message ||
          "Не удалось отправить код",
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
        `${API}/api/check-verification-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            phone: form.phone.trim(),
            code: form.code.trim(),
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok || data?.error) {
        throw new Error(
          getResponseError(data, response.status)
        );
      }

      const currentUser = {
        ...data,
        phone: getPhone(data) || form.phone.trim(),
      };

      localStorage.setItem(
        "user",
        JSON.stringify(currentUser)
      );

      window.dispatchEvent(new Event("user-updated"));

      const hasProfileData = Boolean(
        getFirstName(currentUser) &&
          getLastName(currentUser)
      );

      if (hasProfileData) {
        setUser(currentUser);
        setIsModalOpen(false);
        setForm(initialForm);
      } else {
        setForm((previous) => ({
          ...previous,
          step: "profile",
          error: "",
        }));
      }
    } catch (error) {
      console.error(error);

      setForm((previous) => ({
        ...previous,
        error:
          error.message ||
          "Неверный код или ошибка сервера",
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function saveProfile(event) {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
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

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);

    window.dispatchEvent(new Event("user-updated"));

    setIsModalOpen(false);
    setForm(initialForm);
  }

  function renderError() {
    if (!form.error) return null;

    return (
      <p className="navbar-form-error">
        {form.error}
      </p>
    );
  }

  return (
    <>
      <nav
        className="premium-navbar"
        role="navigation"
        aria-label="Главная навигация"
      >
        <div className="navbar-shell">
          <NavLink
            className="navbar-logo"
            to="/"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Главная страница"
          >
            <img
              src="https://cdn.foodpicasso.com/assets/2023/07/06/eb22f9d7023be861993888ee788ed89d---png_original_919c8_convert.webp"
              alt="Ser Go'sht"
            />
          </NavLink>

          <button
            type="button"
            className={`navbar-burger-button ${
              isMenuOpen ? "is-active" : ""
            }`}
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
            onClick={() =>
              setIsMenuOpen((previous) => !previous)
            }
          >
            <span />
            <span />
            <span />
          </button>

          <div
            className={`navbar-actions ${
              isMenuOpen ? "is-active" : ""
            }`}
          >
            <button
              type="button"
              className="navbar-icon-button"
              onClick={toggleTheme}
              aria-label={
                isDarkTheme
                  ? "Включить светлую тему"
                  : "Включить тёмную тему"
              }
              title={
                isDarkTheme
                  ? "Светлая тема"
                  : "Тёмная тема"
              }
            >
              {isDarkTheme ? "☀" : "◐"}
            </button>

            <NavLink
              to="/Basket"
              className="navbar-cart-button"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="navbar-cart-icon">🛒</span>

              <span className="navbar-cart-text">
                Корзина
              </span>

              {cartCount > 0 && (
                <span className="navbar-cart-count">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </NavLink>

            {user ? (
              <div
                className="navbar-profile-wrapper"
                ref={profileRef}
              >
                <button
                  type="button"
                  className="navbar-user-button"
                  onClick={toggleProfileMenu}
                  aria-expanded={isProfileOpen}
                  aria-label="Открыть данные профиля"
                >
                  <span className="navbar-user-avatar">
                    {getUserInitial(user)}
                  </span>

                  <span className="navbar-user-short-name">
                    {getShortUserName(user)}
                  </span>

                  <span
                    className={`navbar-user-arrow ${
                      isProfileOpen ? "is-open" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="navbar-profile-popup">
                    <div className="popup-user-top">
                      <div className="popup-avatar">
                        {getUserInitial(user)}
                      </div>

                      <div>
                        <strong>
                          {getShortUserName(user)}
                        </strong>

                        <span>Профиль</span>
                      </div>
                    </div>

                    <div className="popup-info-list">
                      <div>
                        <span>Имя</span>
                        <strong>
                          {getFirstName(user) ||
                            "Не указано"}
                        </strong>
                      </div>

                      <div>
                        <span>Фамилия</span>
                        <strong>
                          {getLastName(user) ||
                            "Не указана"}
                        </strong>
                      </div>

                      <div>
                        <span>Номер</span>
                        <strong>
                          {getPhone(user) ||
                            "Не указан"}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="popup-logout-button"
                      onClick={logout}
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="navbar-login-button"
                onClick={openLoginModal}
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div
          className="navbar-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Вход в аккаунт"
        >
          <div
            className="navbar-modal-overlay"
            onClick={closeModal}
          />

          <div className="navbar-modal">
            <header className="navbar-modal-head">
              <div>
                <span className="navbar-modal-step">
                  {form.step === "phone" && "Вход"}

                  {form.step === "code" &&
                    "Подтверждение"}

                  {form.step === "profile" &&
                    "Профиль"}
                </span>

                <h2>
                  {form.step === "phone" &&
                    "Введите номер"}

                  {form.step === "code" &&
                    "Введите код"}

                  {form.step === "profile" &&
                    "Ваши данные"}
                </h2>
              </div>

              <button
                type="button"
                className="navbar-modal-close"
                onClick={closeModal}
                aria-label="Закрыть"
                disabled={isLoading}
              >
                ×
              </button>
            </header>

            {form.step === "phone" && (
              <form onSubmit={sendCode}>
                <section className="navbar-modal-body">
                  <label
                    className="navbar-field"
                    htmlFor="login-phone"
                  >
                    <span>Номер телефона</span>

                    <input
                      id="login-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        changeForm(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="+998 90 123 45 67"
                      autoComplete="tel"
                      required
                    />
                  </label>

                  {renderError()}
                </section>

                <footer className="navbar-modal-foot">
                  <button
                    type="submit"
                    className="navbar-modal-primary"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Отправка..."
                      : "Получить код"}
                  </button>
                </footer>
              </form>
            )}

            {form.step === "code" && (
              <form onSubmit={verifyCode}>
                <section className="navbar-modal-body">
                  <p className="navbar-code-text">
                    Код отправлен на{" "}
                    <strong>{form.phone}</strong>
                  </p>

                  <label
                    className="navbar-field"
                    htmlFor="verification-code"
                  >
                    <span>Код из сообщения</span>

                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={form.code}
                      onChange={(event) =>
                        changeForm(
                          "code",
                          event.target.value
                        )
                      }
                      placeholder="Введите код"
                      autoComplete="one-time-code"
                      required
                    />
                  </label>

                  {renderError()}
                </section>

                <footer className="navbar-modal-foot">
                  <button
                    type="button"
                    className="navbar-modal-secondary"
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

                  <button
                    type="submit"
                    className="navbar-modal-primary"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Проверка..."
                      : "Проверить"}
                  </button>
                </footer>
              </form>
            )}

            {form.step === "profile" && (
              <form onSubmit={saveProfile}>
                <section className="navbar-modal-body">
                  <div className="navbar-form-grid">
                    <label
                      className="navbar-field"
                      htmlFor="first-name"
                    >
                      <span>Имя</span>

                      <input
                        id="first-name"
                        type="text"
                        value={form.firstName}
                        onChange={(event) =>
                          changeForm(
                            "firstName",
                            event.target.value
                          )
                        }
                        placeholder="Ваше имя"
                        autoComplete="given-name"
                        required
                      />
                    </label>

                    <label
                      className="navbar-field"
                      htmlFor="last-name"
                    >
                      <span>Фамилия</span>

                      <input
                        id="last-name"
                        type="text"
                        value={form.lastName}
                        onChange={(event) =>
                          changeForm(
                            "lastName",
                            event.target.value
                          )
                        }
                        placeholder="Ваша фамилия"
                        autoComplete="family-name"
                        required
                      />
                    </label>
                  </div>

                  {renderError()}
                </section>

                <footer className="navbar-modal-foot">
                  <button
                    type="submit"
                    className="navbar-modal-primary"
                  >
                    Сохранить
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .premium-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          min-height: 76px;
          background: linear-gradient(
            180deg,
            #d41313 0%,
            #c81e1e 100%
          );
          box-shadow: 0 8px 24px -12px rgba(200, 30, 30, .55);
        }

        .navbar-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(1200px, calc(100% - 36px));
          min-height: 76px;
          margin: 0 auto;
          gap: 18px;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
        }

        .navbar-logo img {
          display: block;
          max-width: 150px;
          max-height: 46px;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .25));
          transition: transform .25s var(--ease-out);
        }

        .navbar-logo:hover img {
          transform: scale(1.04);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
        }

        .navbar-icon-button,
        .navbar-cart-button,
        .navbar-user-button,
        .navbar-login-button {
          min-height: 42px;
          border-radius: 999px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          transition:
            transform .2s var(--ease-out),
            box-shadow .2s ease,
            background .2s ease;
        }

        .navbar-icon-button {
          display: grid;
          width: 42px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .25);
          background: rgba(255, 255, 255, .12);
          color: #fff;
          cursor: pointer;
          font-size: 20px;
          place-items: center;
        }

        .navbar-icon-button:hover {
          background: rgba(255, 255, 255, .2);
          transform: translateY(-1px);
        }

        .navbar-cart-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 17px;
          border: 1px solid rgba(255, 255, 255, .25);
          background: rgba(255, 255, 255, .12);
          color: #fff;
          text-decoration: none;
        }

        .navbar-cart-button:hover {
          background: rgba(255, 255, 255, .2);
          color: #fff;
          transform: translateY(-1px);
        }

        .navbar-cart-icon {
          font-size: 16px;
        }

        .navbar-cart-count {
          position: absolute;
          top: -8px;
          right: -7px;
          display: grid;
          min-width: 21px;
          height: 21px;
          padding: 0 5px;
          border: 2px solid #c81e1e;
          border-radius: 999px;
          background: #fff;
          color: #c81e1e;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          place-items: center;
        }

        .navbar-login-button {
          padding: 0 21px;
          border: 0;
          background: #fff;
          box-shadow: 0 8px 16px -8px rgba(0, 0, 0, .35);
          color: #a81616;
          cursor: pointer;
        }

        .navbar-login-button:hover {
          box-shadow: 0 12px 22px -9px rgba(0, 0, 0, .4);
          transform: translateY(-1px);
        }

        .navbar-profile-wrapper {
          position: relative;
        }

        .navbar-user-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px 0 5px;
          border: 1px solid rgba(255, 255, 255, .25);
          background: rgba(255, 255, 255, .12);
          color: #fff;
          cursor: pointer;
        }

        .navbar-user-button:hover {
          background: rgba(255, 255, 255, .2);
          transform: translateY(-1px);
        }

        .navbar-user-avatar {
          display: grid;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 50%;
          background: rgba(27, 21, 18, .25);
          color: #fff;
          font-family: var(--font-display);
          font-size: 16px;
          place-items: center;
        }

        .navbar-user-short-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .navbar-user-arrow {
          font-size: 12px;
          transition: transform .2s ease;
        }

        .navbar-user-arrow.is-open {
          transform: rotate(180deg);
        }

        .navbar-profile-popup {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 290px;
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 22px 48px -20px rgba(27, 21, 18, .48);
          color: var(--ink);
          animation: profile-popup-show .2s var(--ease-out);
        }

        @keyframes profile-popup-show {
          from {
            opacity: 0;
            transform: translateY(-7px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .popup-user-top {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }

        .popup-avatar {
          display: grid;
          width: 42px;
          height: 42px;
          border: 2px solid var(--gold-soft);
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--ember)
          );
          color: #fff;
          font-family: var(--font-display);
          font-size: 18px;
          place-items: center;
        }

        .popup-user-top > div:last-child {
          display: grid;
          gap: 2px;
        }

        .popup-user-top strong {
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 600;
        }

        .popup-user-top span {
          color: #938474;
          font-size: 11px;
          font-weight: 600;
        }

        .popup-info-list {
          display: grid;
          gap: 13px;
          padding: 16px;
        }

        .popup-info-list div {
          display: grid;
          gap: 3px;
        }

        .popup-info-list span {
          color: #9a8b7c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .popup-info-list strong {
          overflow: hidden;
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .popup-logout-button {
          width: calc(100% - 32px);
          min-height: 42px;
          margin: 0 16px 16px;
          border: 1px solid #efc9c9;
          border-radius: 999px;
          background: #fffafa;
          color: var(--ember);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .popup-logout-button:hover {
          background: #fbeaea;
          transform: translateY(-1px);
        }

        .navbar-burger-button {
          display: none;
          width: 42px;
          height: 42px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .3);
          border-radius: 12px;
          background: rgba(255, 255, 255, .1);
          cursor: pointer;
        }

        .navbar-burger-button span {
          display: block;
          width: 19px;
          height: 2px;
          margin: 4px auto;
          border-radius: 2px;
          background: #fff;
          transition: transform .2s ease, opacity .2s ease;
        }

        .navbar-burger-button.is-active span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .navbar-burger-button.is-active span:nth-child(2) {
          opacity: 0;
        }

        .navbar-burger-button.is-active span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        .navbar-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .navbar-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(27, 21, 18, .62);
          backdrop-filter: blur(5px);
        }

        .navbar-modal {
          position: relative;
          width: min(520px, 100%);
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(27, 21, 18, .65);
          animation: navbar-modal-show .25s var(--ease-out);
        }

        @keyframes navbar-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .navbar-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }

        .navbar-modal-head > div {
          display: grid;
          gap: 4px;
        }

        .navbar-modal-step {
          color: var(--ember);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .navbar-modal-head h2 {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
        }

        .navbar-modal-close {
          display: grid;
          width: 36px;
          height: 36px;
          border: 1px solid var(--cream-deep);
          border-radius: 50%;
          background: #fff;
          color: #88796d;
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            color .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .navbar-modal-close:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--ember);
          transform: rotate(90deg);
        }

        .navbar-modal-body {
          padding: 24px 26px;
        }

        .navbar-code-text {
          margin: 0 0 18px;
          padding: 12px 14px;
          border-left: 3px solid var(--ember);
          border-radius: 8px;
          background: var(--cream);
          color: #66584c;
          font-size: 13px;
          line-height: 1.5;
        }

        .navbar-code-text strong {
          color: var(--ink);
        }

        .navbar-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .navbar-field {
          display: block;
        }

        .navbar-field > span {
          display: block;
          margin-bottom: 8px;
          color: #6d5f52;
          font-size: 12px;
          font-weight: 700;
        }

        .navbar-field input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border: 1px solid var(--cream-deep);
          border-radius: 12px;
          outline: none;
          background: #fcf9f2;
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 15px;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .navbar-field input:focus {
          border-color: rgba(200, 155, 60, .8);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(200, 155, 60, .14);
        }

        .navbar-form-error {
          margin: 14px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          background: #fbeaea;
          color: #b52c2c;
          font-size: 12px;
          font-weight: 700;
        }

        .navbar-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--cream-deep);
        }

        .navbar-modal-primary,
        .navbar-modal-secondary {
          min-height: 46px;
          border-radius: 999px;
          padding: 0 22px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .navbar-modal-primary {
          border: 0;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
        }

        .navbar-modal-primary:hover:not(:disabled) {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          transform: translateY(-2px);
        }

        .navbar-modal-secondary {
          border: 1px solid var(--cream-deep);
          background: #fff;
          color: #89796b;
        }

        .navbar-modal-secondary:hover:not(:disabled) {
          border-color: #cfc0ac;
          color: var(--ink);
        }

        .navbar-modal-primary:disabled,
        .navbar-modal-secondary:disabled,
        .navbar-modal-close:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        body.dark-theme .premium-navbar {
          background: linear-gradient(
            180deg,
            #431c18 0%,
            #27130f 100%
          );
          box-shadow: 0 8px 24px -12px rgba(0, 0, 0, .7);
        }

        body.dark-theme .navbar-icon-button,
        body.dark-theme .navbar-cart-button,
        body.dark-theme .navbar-user-button {
          border-color: rgba(255, 255, 255, .18);
          background: rgba(255, 255, 255, .08);
        }

        body.dark-theme .navbar-profile-popup {
          border-color: #45342b;
          background: #251b17;
          color: #f8f3ea;
        }

        body.dark-theme .popup-user-top {
          border-color: #45342b;
          background: #30221c;
        }

        body.dark-theme .popup-user-top strong,
        body.dark-theme .popup-info-list strong {
          color: #f8f3ea;
        }

        body.dark-theme .popup-user-top span,
        body.dark-theme .popup-info-list span {
          color: #bba999;
        }

        body.dark-theme .popup-logout-button {
          border-color: #6f3730;
          background: #37201d;
          color: #ff8b80;
        }

        @media screen and (max-width: 800px) {
          .premium-navbar {
            min-height: 62px;
          }

          .navbar-shell {
            width: calc(100% - 24px);
            min-height: 62px;
          }

          .navbar-logo img {
            max-width: 115px;
            max-height: 37px;
          }

          .navbar-burger-button {
            display: block;
          }

          .navbar-actions {
            position: absolute;
            top: 70px;
            right: 12px;
            left: 12px;
            display: none;
            align-items: stretch;
            flex-wrap: wrap;
            justify-content: center;
            padding: 12px;
            border: 1px solid var(--cream-deep);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 18px 40px -20px rgba(27, 21, 18, .45);
          }

          .navbar-actions.is-active {
            display: flex;
          }

          .navbar-icon-button,
          .navbar-cart-button,
          .navbar-user-button,
          .navbar-login-button {
            min-height: 46px;
          }

          .navbar-cart-button,
          .navbar-login-button {
            flex: 1;
            justify-content: center;
          }

          .navbar-profile-wrapper {
            flex: 1;
          }

          .navbar-user-button {
            width: 100%;
            justify-content: center;
          }

          .navbar-profile-popup {
            position: fixed;
            top: auto;
            right: 12px;
            bottom: 82px;
            left: 12px;
            width: auto;
          }

          body.dark-theme .navbar-actions {
            border-color: #45332a;
            background: #251b17;
          }

          .navbar-modal-root {
            padding: 0;
            align-items: end;
          }

          .navbar-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .navbar-modal-body {
            max-height: 62vh;
            overflow-y: auto;
            padding: 20px;
          }

          .navbar-modal-head,
          .navbar-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }

          .navbar-form-grid {
            grid-template-columns: 1fr;
          }

          .navbar-modal-foot .navbar-modal-primary,
          .navbar-modal-foot .navbar-modal-secondary {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}
