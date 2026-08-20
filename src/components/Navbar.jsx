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

function getShortName(user) {
  const firstName = getFirstName(user);
  const lastName = getLastName(user);

  if (lastName && firstName) {
    return `${lastName}.${firstName.charAt(0).toUpperCase()}`;
  }

  if (lastName) return lastName;
  if (firstName) return firstName;

  return "Профиль";
}

function getInitial(user) {
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

    return cart.reduce(
      (sum, item) =>
        sum + Math.max(1, Number(item.count || 1)),
      0
    );
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

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isDarkTheme, setIsDarkTheme] =
    useState(false);

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
    function closeProfileOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeProfileOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeProfileOutside
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

  function logout() {
    localStorage.removeItem("user");

    setUser(null);
    setIsProfileOpen(false);

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

      const hasName = Boolean(
        getFirstName(currentUser) &&
          getLastName(currentUser)
      );

      if (hasName) {
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
      <p className="mobile-navbar-form-error">
        {form.error}
      </p>
    );
  }

  return (
    <>
      <nav className="mobile-safe-navbar">
        <div className="mobile-safe-navbar-inner">
          <NavLink
            to="/"
            className="mobile-safe-logo"
            aria-label="Главная"
          >
            <img
              src="https://cdn.foodpicasso.com/assets/2023/07/06/eb22f9d7023be861993888ee788ed89d---png_original_919c8_convert.webp"
              alt="Ser Go'sht"
            />
          </NavLink>

          <div className="mobile-safe-actions">
            <button
              type="button"
              className="mobile-theme-button"
              onClick={toggleTheme}
              aria-label={
                isDarkTheme
                  ? "Светлая тема"
                  : "Тёмная тема"
              }
            >
              {isDarkTheme ? "☀" : "◐"}
            </button>

            <NavLink
              to="/Basket"
              className="mobile-cart-button"
              aria-label="Корзина"
            >
              <span>🛒</span>

              {cartCount > 0 && (
                <b>
                  {cartCount > 99 ? "99+" : cartCount}
                </b>
              )}
            </NavLink>

            {user ? (
              <div
                className="mobile-user-wrapper"
                ref={profileRef}
              >
                <button
                  type="button"
                  className="mobile-user-button"
                  onClick={() =>
                    setIsProfileOpen((previous) => !previous)
                  }
                >
                  <span className="mobile-user-avatar">
                    {getInitial(user)}
                  </span>

                  <span className="mobile-user-name">
                    {getShortName(user)}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="mobile-profile-popup">
                    <div className="mobile-popup-top">
                      <div className="mobile-popup-avatar">
                        {getInitial(user)}
                      </div>

                      <div>
                        <strong>
                          {getShortName(user)}
                        </strong>

                        <span>Профиль</span>
                      </div>
                    </div>

                    <div className="mobile-popup-info">
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
                      className="mobile-popup-logout"
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
                className="mobile-login-button"
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
          className="mobile-login-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Вход"
        >
          <div
            className="mobile-login-modal-overlay"
            onClick={closeModal}
          />

          <div className="mobile-login-modal">
            <header className="mobile-login-modal-head">
              <div>
                <span>
                  {form.step === "phone" && "Вход"}
                  {form.step === "code" && "Код"}
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
                onClick={closeModal}
                className="mobile-login-close"
                disabled={isLoading}
                aria-label="Закрыть"
              >
                ×
              </button>
            </header>

            {form.step === "phone" && (
              <form onSubmit={sendCode}>
                <section className="mobile-login-modal-body">
                  <label className="mobile-login-field">
                    <span>Номер телефона</span>

                    <input
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

                <footer className="mobile-login-modal-foot">
                  <button
                    type="submit"
                    className="mobile-login-primary"
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
                <section className="mobile-login-modal-body">
                  <p className="mobile-login-phone-text">
                    Код отправлен на{" "}
                    <strong>{form.phone}</strong>
                  </p>

                  <label className="mobile-login-field">
                    <span>Код из сообщения</span>

                    <input
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

                <footer className="mobile-login-modal-foot">
                  <button
                    type="button"
                    className="mobile-login-secondary"
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
                    className="mobile-login-primary"
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
                <section className="mobile-login-modal-body">
                  <div className="mobile-login-form-grid">
                    <label className="mobile-login-field">
                      <span>Имя</span>

                      <input
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

                    <label className="mobile-login-field">
                      <span>Фамилия</span>

                      <input
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

                <footer className="mobile-login-modal-foot">
                  <button
                    type="submit"
                    className="mobile-login-primary"
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
        .mobile-safe-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          min-height: 70px;
          background: linear-gradient(
            180deg,
            #d41313 0%,
            #c81e1e 100%
          );
          box-shadow: 0 8px 24px -12px rgba(200, 30, 30, .55);
        }

        .mobile-safe-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(1200px, calc(100% - 36px));
          min-height: 70px;
          margin: 0 auto;
          gap: 15px;
        }

        .mobile-safe-logo {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
        }

        .mobile-safe-logo img {
          display: block;
          max-width: 145px;
          max-height: 43px;
          filter: drop-shadow(
            0 2px 6px rgba(0, 0, 0, .25)
          );
        }

        .mobile-safe-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .mobile-theme-button,
        .mobile-cart-button,
        .mobile-user-button,
        .mobile-login-button {
          min-height: 42px;
          border-radius: 999px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
        }

        .mobile-theme-button {
          display: grid;
          width: 42px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .25);
          border-radius: 50%;
          background: rgba(255, 255, 255, .12);
          color: #fff;
          cursor: pointer;
          font-size: 20px;
          place-items: center;
        }

        .mobile-cart-button {
          position: relative;
          display: grid;
          width: 42px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .25);
          border-radius: 50%;
          background: rgba(255, 255, 255, .12);
          color: #fff;
          font-size: 17px;
          place-items: center;
          text-decoration: none;
        }

        .mobile-cart-button b {
          position: absolute;
          top: -8px;
          right: -8px;
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
          place-items: center;
        }

        .mobile-user-wrapper {
          position: relative;
        }

        .mobile-user-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px 0 5px;
          border: 1px solid rgba(255, 255, 255, .25);
          background: rgba(255, 255, 255, .12);
          color: #fff;
          cursor: pointer;
        }

        .mobile-user-avatar {
          display: grid;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255, 255, 255, .55);
          border-radius: 50%;
          background: rgba(27, 21, 18, .24);
          color: #fff;
          font-family: var(--font-display);
          font-size: 16px;
          place-items: center;
        }

        .mobile-user-name {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-login-button {
          padding: 0 19px;
          border: 0;
          background: #fff;
          color: #a81616;
          cursor: pointer;
        }

        .mobile-profile-popup {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 285px;
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 22px 48px -20px rgba(27, 21, 18, .48);
          color: var(--ink);
          animation: mobile-popup-show .2s var(--ease-out);
        }

        @keyframes mobile-popup-show {
          from {
            opacity: 0;
            transform: translateY(-7px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .mobile-popup-top {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }

        .mobile-popup-avatar {
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

        .mobile-popup-top div:last-child {
          display: grid;
          gap: 2px;
        }

        .mobile-popup-top strong {
          font-family: var(--font-display);
          font-size: 17px;
        }

        .mobile-popup-top span {
          color: #938474;
          font-size: 11px;
          font-weight: 600;
        }

        .mobile-popup-info {
          display: grid;
          gap: 13px;
          padding: 16px;
        }

        .mobile-popup-info div {
          display: grid;
          gap: 3px;
        }

        .mobile-popup-info span {
          color: #9a8b7c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .mobile-popup-info strong {
          overflow: hidden;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-popup-logout {
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
        }

        .mobile-login-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .mobile-login-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(27, 21, 18, .62);
          backdrop-filter: blur(5px);
        }

        .mobile-login-modal {
          position: relative;
          width: min(520px, 100%);
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(27, 21, 18, .65);
        }

        .mobile-login-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }

        .mobile-login-modal-head div {
          display: grid;
          gap: 4px;
        }

        .mobile-login-modal-head span {
          color: var(--ember);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .mobile-login-modal-head h2 {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
        }

        .mobile-login-close {
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
        }

        .mobile-login-modal-body {
          padding: 24px 26px;
        }

        .mobile-login-field {
          display: block;
        }

        .mobile-login-field > span {
          display: block;
          margin-bottom: 8px;
          color: #6d5f52;
          font-size: 12px;
          font-weight: 700;
        }

        .mobile-login-field input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border: 1px solid var(--cream-deep);
          border-radius: 12px;
          outline: none;
          background: #fcf9f2;
          color: var(--ink);
          font-size: 15px;
        }

        .mobile-login-field input:focus {
          border-color: var(--ember);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(200, 30, 30, .1);
        }

        .mobile-login-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .mobile-login-phone-text {
          margin: 0 0 18px;
          padding: 12px 14px;
          border-left: 3px solid var(--ember);
          border-radius: 8px;
          background: var(--cream);
          color: #66584c;
          font-size: 13px;
        }

        .mobile-navbar-form-error {
          margin: 14px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          background: #fbeaea;
          color: #b52c2c;
          font-size: 12px;
          font-weight: 700;
        }

        .mobile-login-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--cream-deep);
        }

        .mobile-login-primary,
        .mobile-login-secondary {
          min-height: 46px;
          border-radius: 999px;
          padding: 0 22px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .mobile-login-primary {
          border: 0;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--ember)
          );
          color: #fff;
        }

        .mobile-login-secondary {
          border: 1px solid var(--cream-deep);
          background: #fff;
          color: #89796b;
        }

        body.dark-theme .mobile-safe-navbar {
          background: linear-gradient(
            180deg,
            #431c18 0%,
            #27130f 100%
          );
        }

        body.dark-theme .mobile-profile-popup,
        body.dark-theme .mobile-login-modal {
          border-color: #45342b;
          background: #251b17;
          color: #f8f3ea;
        }

        body.dark-theme .mobile-popup-top,
        body.dark-theme .mobile-login-modal-head {
          border-color: #45342b;
          background: #30221c;
        }

        body.dark-theme .mobile-popup-top strong,
        body.dark-theme .mobile-popup-info strong,
        body.dark-theme .mobile-login-modal-head h2 {
          color: #f8f3ea;
        }

        body.dark-theme .mobile-popup-top span,
        body.dark-theme .mobile-popup-info span {
          color: #bba999;
        }

        body.dark-theme .mobile-login-field input {
          border-color: #584036;
          background: #342620;
          color: #f8f3ea;
        }

        @media screen and (max-width: 700px) {
          .mobile-safe-navbar {
            min-height: 62px;
          }

          .mobile-safe-navbar-inner {
            width: calc(100% - 24px);
            min-height: 62px;
            gap: 8px;
          }

          .mobile-safe-logo img {
            max-width: 110px;
            max-height: 36px;
          }

          .mobile-safe-actions {
            gap: 6px;
          }

          .mobile-theme-button {
            display: none;
          }

          .mobile-cart-button {
            width: 40px;
            height: 40px;
          }

          .mobile-user-button {
            min-height: 40px;
            padding: 0 9px 0 4px;
          }

          .mobile-user-avatar {
            width: 30px;
            height: 30px;
          }

          .mobile-user-name {
            max-width: 105px;
            font-size: 12px;
          }

          .mobile-login-button {
            min-height: 40px;
            padding: 0 15px;
            font-size: 12px;
          }

          .mobile-profile-popup {
            position: fixed;
            right: 12px;
            bottom: 82px;
            left: 12px;
            top: auto;
            width: auto;
          }

          .mobile-login-modal-root {
            padding: 0;
            align-items: end;
          }

          .mobile-login-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .mobile-login-modal-body {
            max-height: 62vh;
            overflow-y: auto;
            padding: 20px;
          }

          .mobile-login-modal-head,
          .mobile-login-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }

          .mobile-login-form-grid {
            grid-template-columns: 1fr;
          }

          .mobile-login-modal-foot .mobile-login-primary,
          .mobile-login-modal-foot .mobile-login-secondary {
            flex: 1;
          }
        }

        @media screen and (max-width: 390px) {
          .mobile-safe-logo img {
            max-width: 88px;
          }

          .mobile-user-name {
            display: none;
          }

          .mobile-user-button {
            width: 40px;
            padding: 4px;
            border-radius: 50%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
