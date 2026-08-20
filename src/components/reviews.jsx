import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";

const API = "https://rest.sergosht-api.uz";

const CATEGORIES = [
  { key: "kitchen", label: "Кухня" },
  { key: "service", label: "Сервис" },
  { key: "delivery", label: "Доставка" },
];

const EMPTY_RATINGS = {
  kitchen: 0,
  service: 0,
  delivery: 0,
};

const TOAST = {
  position: "bottom-right",
  autoClose: 3500,
  theme: "dark",
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getFullName(user) {
  if (!user) return "";

  const firstName = String(
    user.firstName ||
      user.first_name ||
      user.name ||
      ""
  ).trim();

  const lastName = String(
    user.lastName ||
      user.last_name ||
      user.surname ||
      ""
  ).trim();

  return `${lastName} ${firstName}`.trim();
}

function getReviewUser(review) {
  return (
    review?.user ||
    review?.author ||
    review?.customer ||
    review?.profile ||
    {}
  );
}

function getReviewName(review) {
  const userName = getFullName(getReviewUser(review));

  if (userName) {
    return userName;
  }

  const directName = getFullName({
    firstName:
      review?.firstName ||
      review?.first_name ||
      review?.user_first_name ||
      "",

    lastName:
      review?.lastName ||
      review?.last_name ||
      review?.user_last_name ||
      "",
  });

  return directName || "Пользователь";
}

function getReviewText(review) {
  return String(
    review?.text ||
      review?.comment ||
      review?.message ||
      ""
  ).trim();
}

function getReviewDate(review) {
  return (
    review?.created_at ||
    review?.createdAt ||
    review?.created ||
    review?.date ||
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

function getRating(review, key) {
  return Number(
    review?.ratings?.[key] ||
      review?.[`${key}_rating`] ||
      review?.[`${key}Rating`] ||
      0
  );
}

function getTotalRating(review) {
  return CATEGORIES.reduce(
    (total, category) =>
      total + getRating(review, category.key),
    0
  );
}

function getAverageRating(review) {
  return getTotalRating(review) / CATEGORIES.length;
}

function getReviewsList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
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

function StarRow({ value }) {
  return (
    <span
      className="rv-stars"
      aria-label={`Оценка ${value} из 5`}
    >
      {[1, 2, 3, 4, 5].map((number) => (
        <span
          key={number}
          className={`rv-star ${
            number <= value ? "is-on" : ""
          }`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ label, value, onChange }) {
  return (
    <div className="rv-picker" aria-label={label}>
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          className={`rv-pick ${
            number <= value ? "is-on" : ""
          }`}
          onClick={() => onChange(number)}
          aria-label={`${label}: ${number} из 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [hasOrders, setHasOrders] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState(EMPTY_RATINGS);

  useEffect(() => {
    const savedUser = getUser();

    setUser(savedUser);
    loadReviews(true);

    if (savedUser?.token) {
      checkOrders(savedUser);
    }
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
  }, [isModalOpen, isSubmitting]);

  async function loadReviews(showLoader = false) {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`${API}/api/review`, {
        headers: {
          Accept: "application/json",
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

      const loadedReviews = getReviewsList(data);

      const newestReviewsFirst = [...loadedReviews].sort(
        (firstReview, secondReview) => {
          const firstDate = new Date(
            getReviewDate(firstReview) || 0
          ).getTime();

          const secondDate = new Date(
            getReviewDate(secondReview) || 0
          ).getTime();

          return secondDate - firstDate;
        }
      );

      setReviews(newestReviewsFirst);
    } catch (error) {
      console.error(error);

      toast.error(
        error.message || "Не удалось загрузить отзывы",
        TOAST
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function checkOrders(savedUser) {
    try {
      const response = await fetch(`${API}/api/order`, {
        headers: {
          Accept: "application/json",
          Authorization: savedUser.token,
        },
      });

      if (!response.ok) {
        setHasOrders(false);
        return;
      }

      const data = await response.json();

      const orders = Array.isArray(data)
        ? data
        : data?.orders ||
          data?.data ||
          data?.results ||
          [];

      setHasOrders(
        Array.isArray(orders) && orders.length > 0
      );
    } catch (error) {
      console.error(error);
      setHasOrders(false);
    }
  }

  function openModal() {
    const savedUser = getUser();
    const fullName = getFullName(savedUser);

    if (!savedUser?.token) {
      toast.warning("Сначала войдите в профиль", TOAST);
      return;
    }

    if (!fullName) {
      toast.warning(
        "Сначала заполните имя и фамилию",
        TOAST
      );
      return;
    }

    if (!hasOrders) {
      toast.warning(
        "Оставить отзыв можно после заказа",
        TOAST
      );
      return;
    }

    setUser(savedUser);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setComment("");
    setRatings(EMPTY_RATINGS);
  }

  function changeRating(key, value) {
    setRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function submitReview(event) {
    event.preventDefault();

    const savedUser = getUser();
    const fullName = getFullName(savedUser);

    if (!savedUser?.token || !fullName) {
      toast.error(
        "Заполните профиль перед отправкой отзыва",
        TOAST
      );
      return;
    }

    if (!hasOrders) {
      toast.error(
        "Оставить отзыв можно после заказа",
        TOAST
      );
      return;
    }

    if (comment.trim().length < 3) {
      toast.error(
        "Напишите комментарий минимум из 3 символов",
        TOAST
      );
      return;
    }

    if (
      Object.values(ratings).some(
        (value) => value === 0
      )
    ) {
      toast.error("Поставьте все три оценки", TOAST);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: savedUser.token,
        },
        body: JSON.stringify({
          text: comment.trim(),
          kitchen_rating: ratings.kitchen,
          service_rating: ratings.service,
          delivery_rating: ratings.delivery,

          firstName:
            savedUser.firstName ||
            savedUser.first_name ||
            savedUser.name ||
            "",

          lastName:
            savedUser.lastName ||
            savedUser.last_name ||
            savedUser.surname ||
            "",
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

      closeModal();

      toast.success("Отзыв опубликован", TOAST);

      await loadReviews(false);
    } catch (error) {
      console.error(error);

      toast.error(
        error.message || "Не удалось отправить отзыв",
        TOAST
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rv-page">
      <Navbar />

      <main className="rv-container">
        <nav className="rv-breadcrumb" aria-label="Навигация">
          <NavLink to="/">Главная</NavLink>
          <span>/</span>
          <span className="is-current">Отзывы</span>
        </nav>

        <header className="rv-header">
          <h1>Отзывы</h1>

          <div className="rv-header-actions">
            <button
              type="button"
              className={`rv-refresh ${
                isRefreshing ? "is-spinning" : ""
              }`}
              onClick={() => loadReviews(false)}
              disabled={isRefreshing || isLoading}
              aria-label="Обновить отзывы"
              title="Обновить отзывы"
            >
              ↻
            </button>

            <button
              type="button"
              className="rv-primary-button"
              onClick={openModal}
            >
              Оставить отзыв
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="rv-grid">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rv-skeleton" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <section className="rv-empty">
            <h2>Отзывов пока нет</h2>
            <p>Первый отзыв появится здесь.</p>
          </section>
        ) : (
          <section className="rv-grid">
            {reviews.map((review, index) => {
              const reviewUser = getReviewUser(review);
              const name = getReviewName(review);
              const text = getReviewText(review);
              const date = formatDate(
                getReviewDate(review)
              );

              const average = getAverageRating(review);

              return (
                <article
                  className="rv-card"
                  key={
                    review?.id ||
                    review?._id ||
                    `review-${index}`
                  }
                >
                  <header className="rv-card-head">
                    <div className="rv-avatar">
                      {reviewUser.photo ? (
                        <img
                          src={
                            reviewUser.photo.startsWith("http")
                              ? reviewUser.photo
                              : `${API}${reviewUser.photo}`
                          }
                          alt={name}
                          loading="lazy"
                        />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="rv-person">
                      <h2>{name} оставил отзыв</h2>

                      {date && <time>{date}</time>}
                    </div>
                  </header>

                  {text && (
                    <p className="rv-comment">{text}</p>
                  )}

                  <div className="rv-ratings">
                    {CATEGORIES.map((category) => {
                      const value = getRating(
                        review,
                        category.key
                      );

                      return (
                        <div
                          className="rv-rating"
                          key={category.key}
                        >
                          <span>{category.label}</span>

                          <div>
                            <StarRow value={value} />
                            <b>{value}/5</b>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <footer className="rv-total">
                    <div>
                      <span>Общая оценка</span>

                      <StarRow
                        value={Math.round(average)}
                      />
                    </div>

                    <strong>
                      {average.toFixed(1)}
                      <small>/5</small>
                    </strong>
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {isModalOpen && (
        <div
          className="rv-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Оставить отзыв"
        >
          <div
            className="rv-overlay"
            onClick={closeModal}
          />

          <form
            className="rv-modal"
            onSubmit={submitReview}
          >
            <header className="rv-modal-head">
              <h2>Оставить отзыв</h2>

              <button
                type="button"
                className="rv-close"
                onClick={closeModal}
                aria-label="Закрыть"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </header>

            <div className="rv-modal-body">
              <p className="rv-author">
                {getFullName(user)} оставит отзыв
              </p>

              {CATEGORIES.map((category) => (
                <div
                  className="rv-form-row"
                  key={category.key}
                >
                  <span>{category.label}</span>

                  <StarPicker
                    label={category.label}
                    value={ratings[category.key]}
                    onChange={(value) =>
                      changeRating(category.key, value)
                    }
                  />
                </div>
              ))}

              <label className="rv-field">
                <span>Комментарий</span>

                <textarea
                  value={comment}
                  maxLength={300}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Ваш комментарий"
                  required
                />

                <small>{comment.length}/300</small>
              </label>
            </div>

            <footer className="rv-modal-foot">
              <button
                type="button"
                className="rv-secondary-button"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Отмена
              </button>

              <button
                type="submit"
                className="rv-primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Публикация..."
                  : "Опубликовать"}
              </button>
            </footer>
          </form>
        </div>
      )}

      <ToastContainer />

      <style>{`
        .rv-page {
          --rv-ink: #211812;
          --rv-cream: #faf6ee;
          --rv-line: #e8dece;
          --rv-muted: #89796b;
          --rv-ember: #c81e1e;
          --rv-ember-light: #e8432f;
          --rv-gold: #c89b3c;
          --rv-gold-soft: #ead9ac;
          --rv-shadow: 0 16px 42px -28px rgba(52, 31, 14, .42);
          --rv-shadow-hover: 0 27px 58px -28px rgba(52, 31, 14, .48);

          min-height: 100vh;
          background: var(--rv-cream);
          color: var(--rv-ink);
        }

        .rv-container {
          width: min(1100px, calc(100% - 36px));
          margin: 0 auto;
          padding: 28px 0 80px;
        }

        .rv-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--rv-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .rv-breadcrumb a {
          color: var(--rv-muted);
          text-decoration: none;
          transition: color .2s ease;
        }

        .rv-breadcrumb a:hover {
          color: var(--rv-ember);
        }

        .rv-breadcrumb .is-current {
          color: var(--rv-ink);
        }

        .rv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin: 22px 0 30px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--rv-line);
        }

        .rv-header h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .rv-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rv-refresh {
          display: grid;
          width: 46px;
          height: 46px;
          border: 1px solid var(--rv-line);
          border-radius: 50%;
          background: #fff;
          color: var(--rv-ink);
          cursor: pointer;
          font-size: 21px;
          place-items: center;
          transition:
            transform .2s ease,
            color .2s ease,
            border-color .2s ease;
        }

        .rv-refresh:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--rv-ember);
          transform: rotate(25deg);
        }

        .rv-refresh:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .rv-refresh.is-spinning {
          animation: rv-spin .8s linear infinite;
        }

        @keyframes rv-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .rv-primary-button,
        .rv-secondary-button {
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

        .rv-primary-button {
          border: 0;
          background: linear-gradient(
            135deg,
            var(--rv-ember-light),
            var(--rv-ember)
          );
          box-shadow: 0 12px 25px -14px rgba(200, 30, 30, .7);
          color: #fff;
        }

        .rv-primary-button:hover:not(:disabled) {
          box-shadow: 0 18px 34px -14px rgba(200, 30, 30, .72);
          transform: translateY(-2px);
        }

        .rv-secondary-button {
          border: 1px solid var(--rv-line);
          background: #fff;
          color: var(--rv-muted);
        }

        .rv-secondary-button:hover:not(:disabled) {
          border-color: #cfc0ac;
          color: var(--rv-ink);
        }

        .rv-primary-button:disabled,
        .rv-secondary-button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .rv-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .rv-card {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 25px;
          border: 1px solid var(--rv-line);
          border-radius: 20px;
          background: #fff;
          box-shadow: var(--rv-shadow);
          transition:
            transform .28s var(--ease-out),
            box-shadow .28s ease,
            border-color .28s ease;
        }

        .rv-card:hover {
          border-color: rgba(200, 155, 60, .55);
          box-shadow: var(--rv-shadow-hover);
          transform: translateY(-4px);
        }

        .rv-card-head {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 18px;
        }

        .rv-avatar {
          display: grid;
          flex: 0 0 auto;
          width: 50px;
          height: 50px;
          overflow: hidden;
          border: 2px solid var(--rv-gold-soft);
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            var(--rv-ember-light),
            var(--rv-ember)
          );
          color: #fff;
          font-size: 19px;
          font-weight: 800;
          place-items: center;
        }

        .rv-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rv-person {
          min-width: 0;
        }

        .rv-person h2 {
          overflow: hidden;
          margin: 0 0 4px;
          color: var(--rv-ink);
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 600;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rv-person time {
          color: var(--rv-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .rv-comment {
          flex: 1;
          margin: 0 0 20px;
          color: #51463d;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .rv-ratings {
          padding: 8px 14px;
          border: 1px solid var(--rv-line);
          border-radius: 14px;
          background: #fcf9f2;
        }

        .rv-rating {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 34px;
          border-bottom: 1px solid var(--rv-line);
        }

        .rv-rating:last-child {
          border-bottom: 0;
        }

        .rv-rating > span {
          color: #7d6e61;
          font-size: 12px;
          font-weight: 700;
        }

        .rv-rating > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .rv-rating b {
          color: var(--rv-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
        }

        .rv-stars {
          display: inline-flex;
          gap: 2px;
        }

        .rv-star {
          color: #ded4c5;
          font-size: 14px;
        }

        .rv-star.is-on {
          color: var(--rv-gold);
          text-shadow: 0 1px 2px rgba(200, 155, 60, .35);
        }

        .rv-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 19px;
          padding-top: 17px;
          border-top: 1px solid var(--rv-line);
        }

        .rv-total > div {
          display: grid;
          gap: 5px;
        }

        .rv-total > div > span {
          color: var(--rv-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .rv-total strong {
          color: var(--rv-ink);
          font-family: var(--font-mono);
          font-size: 23px;
          font-weight: 600;
        }

        .rv-total strong small {
          margin-left: 2px;
          color: var(--rv-muted);
          font-size: 11px;
          font-weight: 500;
        }

        .rv-empty {
          padding: 70px 20px;
          border: 1px dashed var(--rv-line);
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          text-align: center;
        }

        .rv-empty h2 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 600;
        }

        .rv-empty p {
          margin: 0;
          color: var(--rv-muted);
        }

        .rv-skeleton {
          min-height: 300px;
          border-radius: 20px;
          background: linear-gradient(
            90deg,
            #ece4d9,
            #faf6ee,
            #ece4d9
          );
          background-size: 200% 100%;
          animation: rv-shimmer 1.2s ease infinite;
        }

        @keyframes rv-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .rv-modal-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: grid;
          padding: 20px;
          place-items: center;
        }

        .rv-overlay {
          position: absolute;
          inset: 0;
          background: rgba(33, 24, 18, .6);
          backdrop-filter: blur(5px);
        }

        .rv-modal {
          position: relative;
          width: min(560px, 100%);
          overflow: hidden;
          border: 1px solid var(--rv-line);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(33, 24, 18, .62);
          animation: rv-modal-show .25s var(--ease-out);
        }

        @keyframes rv-modal-show {
          from {
            opacity: 0;
            transform: translateY(16px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .rv-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 23px 26px;
          border-bottom: 1px solid var(--rv-line);
          background: #fffdf8;
        }

        .rv-modal-head h2 {
          margin: 0;
          color: var(--rv-ink);
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 600;
        }

        .rv-close {
          display: grid;
          width: 36px;
          height: 36px;
          border: 1px solid var(--rv-line);
          border-radius: 50%;
          background: #fff;
          color: var(--rv-muted);
          cursor: pointer;
          font-size: 14px;
          place-items: center;
          transition:
            color .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .rv-close:hover:not(:disabled) {
          border-color: rgba(200, 30, 30, .4);
          color: var(--rv-ember);
          transform: rotate(90deg);
        }

        .rv-modal-body {
          padding: 23px 26px;
        }

        .rv-author {
          margin: 0 0 17px;
          padding: 12px 14px;
          border-left: 3px solid var(--rv-ember);
          border-radius: 8px;
          background: #fcf9f2;
          color: var(--rv-ink);
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
        }

        .rv-form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid var(--rv-line);
        }

        .rv-form-row > span {
          color: #6d5f52;
          font-size: 13px;
          font-weight: 700;
        }

        .rv-picker {
          display: flex;
        }

        .rv-pick {
          display: grid;
          width: 38px;
          height: 42px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #ded4c5;
          cursor: pointer;
          font-size: 27px;
          place-items: center;
          transition:
            color .15s ease,
            transform .15s ease;
        }

        .rv-pick:hover,
        .rv-pick.is-on {
          color: var(--rv-gold);
          transform: scale(1.12);
        }

        .rv-field {
          display: block;
          margin-top: 20px;
        }

        .rv-field > span {
          display: block;
          margin-bottom: 8px;
          color: #6d5f52;
          font-size: 13px;
          font-weight: 700;
        }

        .rv-field textarea {
          width: 100%;
          min-height: 122px;
          padding: 13px 14px;
          border: 1px solid var(--rv-line);
          border-radius: 14px;
          outline: none;
          background: #fcf9f2;
          color: var(--rv-ink);
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .rv-field textarea:focus {
          border-color: rgba(200, 155, 60, .8);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(200, 155, 60, .14);
        }

        .rv-field small {
          display: block;
          margin-top: 6px;
          color: var(--rv-muted);
          font-size: 11px;
          text-align: right;
        }

        .rv-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 17px 26px 23px;
          border-top: 1px solid var(--rv-line);
        }

        @media screen and (max-width: 760px) {
          .rv-container {
            width: calc(100% - 24px);
            padding-top: 18px;
          }

          .rv-header {
            align-items: stretch;
            flex-direction: column;
          }

          .rv-header-actions {
            width: 100%;
          }

          .rv-primary-button {
            flex: 1;
          }

          .rv-grid {
            grid-template-columns: 1fr;
          }

          .rv-card {
            padding: 20px 17px;
          }

          .rv-modal-root {
            padding: 0;
            align-items: end;
          }

          .rv-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .rv-modal-body {
            max-height: 62vh;
            overflow-y: auto;
            padding: 20px;
          }

          .rv-modal-head,
          .rv-modal-foot {
            padding-right: 20px;
            padding-left: 20px;
          }

          .rv-modal-foot .rv-primary-button,
          .rv-modal-foot .rv-secondary-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
