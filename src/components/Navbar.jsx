import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";


const API = "https://rest.sergosht-api.uz";


const MAX_NAME_LENGTH = 25;


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
    "N"
  );
}


function getCartCount() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );


    if (!Array.isArray(cart)) return 0;


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
      window.removeEventListener(
        "cart-updated",
        updateCart
      );
      window.removeEventListener(
        "user-updated",
        updateUser
      );
    };
  }, []);


  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
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


  function changeName(name, value) {
    changeForm(name, value.slice(0, MAX_NAME_LENGTH));
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
      firstName: form.firstName
        .trim()
        .slice(0, MAX_NAME_LENGTH),
      lastName: form.lastName
        .trim()
        .slice(0, MAX_NAME_LENGTH),
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
      <p className="safe-navbar-error">
        {form.error}
      </p>
    );
  }


  return (
    <>
      <nav
        className="safe-navbar"
        aria-label="Главная навигация"
      >
        <div className="safe-navbar-inner">
          <NavLink
            to="/"
            className="safe-navbar-logo"
            aria-label="Главная"
          >
            <img
              src="https://cdn.foodpicasso.com/assets/2023/07/06/eb22f9d7023be861993888ee788ed89d---png_original_919c8_convert.webp"
              alt="Ser Go'sht"
            />
          </NavLink>


          <div className="safe-navbar-actions">
            <button
              type="button"
              className="safe-theme-button"
              onClick={toggleTheme}
              aria-label={
                isDarkTheme
                  ? "Включить светлую тему"
                  : "Включить тёмную тему"
              }
            >
              {isDarkTheme ? "☀" : "◐"}
            </button>


            <NavLink
              to="/Basket"
              className="safe-cart-button"
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
                className="safe-profile-wrapper"
                ref={profileRef}
              >
                <button
                  type="button"
                  className="safe-user-button"
                  onClick={() =>
                    setIsProfileOpen((previous) => !previous)
                  }
                  aria-expanded={isProfileOpen}
                  aria-label="Открыть профиль"
                >
                  <span className="safe-user-avatar">
                    {getInitial(user)}
                  </span>


                  <span className="safe-user-name">
                    {getShortName(user)}
                  </span>
                </button>


                {isProfileOpen && (
                  <div className="safe-profile-popup">
                    <div className="safe-popup-head">
                      <div className="safe-popup-avatar">
                        {getInitial(user)}
                      </div>


                      <div>
                        <strong>
                          {getShortName(user)}
                        </strong>


                        <span>Профиль</span>
                      </div>
                    </div>


                    <div className="safe-popup-info">
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
                      className="safe-logout-button"
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
                className="safe-login-button"
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
          className="safe-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Вход"
        >
          <div
            className="safe-modal-overlay"
            onClick={closeModal}
          />


          <div className="safe-modal">
            <header className="safe-modal-head">
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
                className="safe-modal-close"
                onClick={closeModal}
                disabled={isLoading}
              >
                ×
              </button>
            </header>


            {form.step === "phone" && (
              <form onSubmit={sendCode}>
                <section className="safe-modal-body">
                  <label className="safe-field">
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


                <footer className="safe-modal-foot">
                  <button
                    type="submit"
                    className="safe-primary-button"
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
                <section className="safe-modal-body">
                  <p className="safe-phone-info">
                    Код отправлен на{" "}
                    <strong>{form.phone}</strong>
                  </p>


                  <label className="safe-field">
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


                <footer className="safe-modal-foot">
                  <button
                    type="button"
                    className="safe-secondary-button"
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
                    className="safe-primary-button"
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
                <section className="safe-modal-body">
                  <div className="safe-form-grid">
                    <label className="safe-field">
                      <span>Имя</span>


                      <input
                        type="text"
                        maxLength={MAX_NAME_LENGTH}
                        value={form.firstName}
                        onChange={(event) =>
                          changeName(
                            "firstName",
                            event.target.value
                          )
                        }
                        placeholder="Ваше имя"
                        autoComplete="given-name"
                        required
                      />
                    </label>


                    <label className="safe-field">
                      <span>Фамилия</span>


                      <input
                        type="text"
                        maxLength={MAX_NAME_LENGTH}
                        value={form.lastName}
                        onChange={(event) =>
                          changeName(
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


                <footer className="safe-modal-foot">
                  <button
                    type="submit"
                    className="safe-primary-button"
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
        html,
        body,
        #root {
          max-width: 100%;
          overflow-x: hidden;
        }


        .safe-navbar {
          position: sticky;
          top: 0;
          z-index: 500;
          width: 100%;
          min-height: 70px;
          background: linear-gradient(
            180deg,
            #d41313 0%,
            #c81e1e 100%
          );
          box-shadow: 0 8px 24px -12px rgba(200, 30, 30, .55);
        }


        .safe-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(1200px, calc(100% - 36px));
          min-height: 70px;
          margin: 0 auto;
          gap: 12px;
        }


        .safe-navbar-logo {
          display: flex;
          flex: 0 1 auto;
          min-width: 0;
          align-items: center;
        }


        .safe-navbar-logo img {
          display: block;
          max-width: 145px;
          max-height: 43px;
          filter: drop-shadow(
            0 2px 6px rgba(0, 0, 0, .25)
          );
        }


        .safe-navbar-actions {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 9px;
        }


        .safe-theme-button,
        .safe-cart-button,
        .safe-user-button,
        .safe-login-button {
          min-height: 42px;
          border-radius: 999px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
        }


        .safe-theme-button {
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


        .safe-cart-button {
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


        .safe-cart-button b {
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


        .safe-profile-wrapper {
          position: relative;
          z-index: 1001;
        }


        .safe-user-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px 0 5px;
          border: 1px solid rgba(255, 255, 255, .25);
          background: rgba(255, 255, 255, .12);
          color: #fff;
          cursor: pointer;
        }


        .safe-user-avatar {
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


        .safe-user-name {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .safe-login-button {
          padding: 0 19px;
          border: 0;
          background: #fff;
          color: #a81616;
          cursor: pointer;
        }


        .safe-profile-popup {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          z-index: 1002;
          width: 285px;
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 22px 48px -20px rgba(27, 21, 18, .48);
          color: var(--ink);
          pointer-events: auto;
        }


        .safe-popup-head {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }


        .safe-popup-avatar {
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


        .safe-popup-head div:last-child {
          display: grid;
          gap: 2px;
        }


        .safe-popup-head strong {
          font-family: var(--font-display);
          font-size: 17px;
        }


        .safe-popup-head span {
          color: #938474;
          font-size: 11px;
          font-weight: 600;
        }


        .safe-popup-info {
          display: grid;
          gap: 13px;
          padding: 16px;
        }


        .safe-popup-info div {
          display: grid;
          gap: 3px;
        }


        .safe-popup-info span {
          color: #9a8b7c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }


        .safe-popup-info strong {
          overflow: hidden;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .safe-logout-button {
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


        .safe-modal-root {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          padding: 20px;
          place-items: center;
        }


        .safe-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(27, 21, 18, .62);
          backdrop-filter: blur(5px);
        }


        .safe-modal {
          position: relative;
          width: min(520px, 100%);
          overflow: hidden;
          border: 1px solid var(--cream-deep);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(27, 21, 18, .65);
        }


        .safe-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--cream-deep);
          background: #fffdf8;
        }


        .safe-modal-head div {
          display: grid;
          gap: 4px;
        }


        .safe-modal-head span {
          color: var(--ember);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }


        .safe-modal-head h2 {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 27px;
          font-weight: 600;
        }


        .safe-modal-close {
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


        .safe-modal-body {
          padding: 24px 26px;
        }


        .safe-field {
          display: block;
        }


        .safe-field > span {
          display: block;
          margin-bottom: 8px;
          color: #6d5f52;
          font-size: 12px;
          font-weight: 700;
        }


        .safe-field input {
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


        .safe-field input:focus {
          border-color: var(--ember);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(200, 30, 30, .1);
        }


        .safe-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }


        .safe-phone-info {
          margin: 0 0 18px;
          padding: 12px 14px;
          border-left: 3px solid var(--ember);
          border-radius: 8px;
          background: var(--cream);
          color: #66584c;
          font-size: 13px;
        }


        .safe-navbar-error {
          margin: 14px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          background: #fbeaea;
          color: #b52c2c;
          font-size: 12px;
          font-weight: 700;
        }


        .safe-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--cream-deep);
        }


        .safe-primary-button,
        .safe-secondary-button {
          min-height: 46px;
          border-radius: 999px;
          padding: 0 22px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }


        .safe-primary-button {
          border: 0;
          background: linear-gradient(
            135deg,
            var(--ember-bright),
            var(--ember)
          );
          color: #fff;
        }


        .safe-secondary-button {
          border: 1px solid var(--cream-deep);
          background: #fff;
          color: #89796b;
        }


        body.dark-theme .safe-navbar {
          background: linear-gradient(
            180deg,
            #431c18 0%,
            #27130f 100%
          );
        }


        body.dark-theme .safe-profile-popup,
        body.dark-theme .safe-modal {
          border-color: #45342b;
          background: #251b17;
          color: #f8f3ea;
        }


        body.dark-theme .safe-popup-head,
        body.dark-theme .safe-modal-head {
          border-color: #45342b;
          background: #30221c;
        }


        body.dark-theme .safe-popup-head strong,
        body.dark-theme .safe-popup-info strong,
        body.dark-theme .safe-modal-head h2 {
          color: #f8f3ea;
        }


        body.dark-theme .safe-popup-head span,
        body.dark-theme .safe-popup-info span {
          color: #bba999;
        }


        body.dark-theme .safe-field input {
          border-color: #584036;
          background: #342620;
          color: #f8f3ea;
        }


        @media screen and (max-width: 700px) {
          .safe-navbar {
            min-height: 62px;
          }


          .safe-navbar-inner {
            width: calc(100% - 24px);
            min-height: 62px;
            gap: 8px;
          }


          .safe-navbar-logo img {
            max-width: 110px;
            max-height: 36px;
          }


          .safe-navbar-actions {
            gap: 6px;
          }


          .safe-theme-button {
            display: none;
          }


          .safe-cart-button {
            width: 40px;
            height: 40px;
          }


          .safe-user-button {
            min-height: 40px;
            padding: 0 5px;
            border-radius: 50%;
          }


          .safe-user-name {
            display: none;
          }


          .safe-user-avatar {
            width: 30px;
            height: 30px;
          }


          .safe-login-button {
            min-height: 40px;
            padding: 0 15px;
            font-size: 12px;
          }


          .safe-profile-wrapper {
            position: static;
          }


          .safe-profile-popup {
            position: fixed;
            right: 12px;
            bottom: 78px;
            left: 12px;
            top: auto;
            width: auto;
            z-index: 1002;
          }


          .safe-modal-root {
            padding: 0;
            align-items: end;
          }


          .safe-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }


          .safe-modal-body {
            max-height: 62vh;
            overflow-y: auto;
            padding: 20px;
          }


          .safe-modal-head,
          .safe-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }


          .safe-form-grid {
            grid-template-columns: 1fr;
          }


          .safe-modal-foot .safe-primary-button,
          .safe-modal-foot .safe-secondary-button {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}
