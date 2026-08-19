import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";

const API = "https://rest.sergosht-api.uz";

const CATEGORIES = [
  { key: "kitchen", label: "Oshxona" },
  { key: "service", label: "Xizmat" },
  { key: "delivery", label: "Yetkazib berish" },
];

const EMPTY_RATINGS = {
  kitchen: 0,
  service: 0,
  delivery: 0,
};

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

function getUserName(user) {
  if (!user) return "Пользователь";

  const first =
    user.firstName ||
    user.first_name ||
    user.name ||
    "";

  const last =
    user.lastName ||
    user.last_name ||
    user.surname ||
    "";

  return `${first} ${last}`.trim() || "Пользователь";
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getReviewUser(review) {
  return review.user || review.author || {};
}

function getReviewName(review) {
  return getUserName(getReviewUser(review));
}

function getReviewText(review) {
  return String(
    review.text ||
      review.comment ||
      review.message ||
      ""
  ).trim();
}

function getReviewDate(review) {
  return (
    review.created_at ||
    review.createdAt ||
    review.created ||
    review.date ||
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
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRating(review, key) {
  return Number(
    review.ratings?.[key] ||
      review[`${key}_rating`] ||
      review[`${key}Rating`] ||
      0
  );
}

function getReviewTotal(review) {
  return (
    getRating(review, "kitchen") +
    getRating(review, "service") +
    getRating(review, "delivery")
  );
}

function StarDisplay({ value }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((number) => (
        <span
          key={number}
          className={
            number <= value
              ? "star-on"
              : "star-off"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          className={
            number <= value
              ? "pick-star picked"
              : "pick-star"
          }
          onClick={() => onChange(number)}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState(EMPTY_RATINGS);

  useEffect(() => {
    const savedUser = getUser();

    setUser(savedUser);
    loadReviews();

    if (savedUser?.token) {
      checkOrders(savedUser);
    }
  }, []);

  async function loadReviews() {
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/review`);

      if (!response.ok) {
        throw new Error("Не удалось загрузить отзывы");
      }

      const data = await response.json();

      setReviews(getList(data, "reviews"));
    } catch (error) {
      console.error(error);

      toast.error("Не удалось загрузить отзывы", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function checkOrders(savedUser) {
    try {
      const response = await fetch(`${API}/api/order`, {
        headers: {
          Authorization: savedUser.token,
        },
      });

      if (!response.ok) {
        setHasOrders(false);
        return;
      }

      const data = await response.json();
      const orders = getList(data, "orders");

      setHasOrders(orders.length > 0);
    } catch (error) {
      console.error(error);
      setHasOrders(false);
    }
  }

  function openModal() {
    const savedUser = getUser();

    if (!savedUser?.token) {
      toast.warning(
        "Сначала войдите в профиль, чтобы оставить отзыв",
        {
          position: "bottom-right",
          autoClose: 3500,
          theme: "dark",
        }
      );

      return;
    }

    if (!hasOrders) {
      toast.warning(
        "Пока вы не сделали заказ, оставить отзыв нельзя",
        {
          position: "bottom-right",
          autoClose: 3500,
          theme: "dark",
        }
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

  function setRating(key, value) {
    setRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function submitReview(event) {
    event.preventDefault();

    const savedUser = getUser();

    if (!savedUser?.token) {
      toast.warning(
        "Сначала войдите в профиль, чтобы оставить отзыв",
        {
          position: "bottom-right",
          autoClose: 3500,
          theme: "dark",
        }
      );

      closeModal();
      return;
    }

    if (!hasOrders) {
      toast.warning(
        "Пока вы не сделали заказ, оставить отзыв нельзя",
        {
          position: "bottom-right",
          autoClose: 3500,
          theme: "dark",
        }
      );

      closeModal();
      return;
    }

    if (!comment.trim()) {
      toast.error("Введите комментарий", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });

      return;
    }

    if (Object.values(ratings).some((value) => value === 0)) {
      toast.error("Поставьте все оценки", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: savedUser.token,
        },
        body: JSON.stringify({
          text: comment.trim(),
          kitchen_rating: ratings.kitchen,
          service_rating: ratings.service,
          delivery_rating: ratings.delivery,
        }),
      });

      let serverReview = {};

      try {
        serverReview = await response.json();
      } catch {
        serverReview = {};
      }

      const newReview = {
        ...serverReview,
        id:
          serverReview.id ||
          `local-${Date.now()}`,
        text: comment.trim(),
        kitchen_rating: ratings.kitchen,
        service_rating: ratings.service,
        delivery_rating: ratings.delivery,
        user: serverReview.user || {
          id: savedUser.id,
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
        },
      };

      setReviews((previous) => [
        newReview,
        ...previous,
      ]);

      closeModal();

      toast.success("Спасибо за вашу оценку!", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });
    } catch (error) {
      console.error(error);

      toast.error(
        "Не удалось отправить отзыв",
        {
          position: "bottom-right",
          autoClose: 3500,
          theme: "dark",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="reviews-page">
      <Navbar />

      <main className="container mt-5 mb-6">
        <nav className="breadcrumb">
          <ul>
            <li>
              <NavLink to="/">Bosh sahifa</NavLink>
            </li>
          </ul>
        </nav>

        <div className="reviews-header mb-5">
          <div>
            <h1 className="title">Fikrlar</h1>

            <p className="subtitle is-6">
              Пользовательские отзывы
            </p>
          </div>

          <button
            type="button"
            className="button is-primary"
            onClick={openModal}
          >
            Fikr qoldirish
          </button>
        </div>

        {!user?.token && (
          <div className="notification is-info is-light mb-5">
            Чтобы оставить отзыв, сначала войдите в профиль.
          </div>
        )}

        {isLoading && (
          <progress
            className="progress is-primary"
            max="100"
          >
            Загрузка
          </progress>
        )}

        {reviews.map((review) => {
          const reviewUser = getReviewUser(review);
          const name = getReviewName(review);
          const text = getReviewText(review);
          const date = formatDate(
            getReviewDate(review)
          );
          const total = getReviewTotal(review);

          return (
            <article
              className="review-card review-animation mb-5"
              key={review.id}
            >
              <div className="review-head">
                <div className="review-avatar">
                  {reviewUser.photo ? (
                    <img
                      src={`${API}${reviewUser.photo}`}
                      alt={name}
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <h3>{name}</h3>

                  {date && <small>{date}</small>}
                </div>
              </div>

              <div className="review-total">
                <span>Общая оценка</span>
                <strong>{total}/15</strong>
              </div>

              <div className="review-ratings">
                {CATEGORIES.map((category) => (
                  <div
                    className="rating-row"
                    key={category.key}
                  >
                    <span>{category.label}</span>

                    <StarDisplay
                      value={getRating(
                        review,
                        category.key
                      )}
                    />
                  </div>
                ))}
              </div>

              {text && (
                <p className="review-text">
                  {text}
                </p>
              )}
            </article>
          );
        })}
      </main>

      <div
        className={`modal ${
          isModalOpen ? "is-active" : ""
        }`}
      >
        <div
          className="modal-background"
          onClick={closeModal}
        ></div>

        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              Fikr qoldirish
            </p>

            <button
              type="button"
              className="delete"
              onClick={closeModal}
              aria-label="Закрыть"
            ></button>
          </header>

          <form onSubmit={submitReview}>
            <section className="modal-card-body">
              <p className="mb-4">
                Отзыв будет опубликован от имени:{" "}
                <strong>{getUserName(user)}</strong>
              </p>

              {CATEGORIES.map((category) => (
                <div
                  className="field"
                  key={category.key}
                >
                  <label className="label">
                    {category.label}
                  </label>

                  <StarPicker
                    value={ratings[category.key]}
                    onChange={(value) =>
                      setRating(
                        category.key,
                        value
                      )
                    }
                  />
                </div>
              ))}

              <div className="field">
                <label className="label">
                  Fikringiz
                </label>

                <textarea
                  className="textarea"
                  value={comment}
                  maxLength={100}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Fikringizni yozing..."
                  required
                ></textarea>

                <p className="help has-text-right">
                  {comment.length}/100
                </p>
              </div>
            </section>

            <footer className="modal-card-foot">
              <button
                type="submit"
                className={`button is-primary ${
                  isSubmitting ? "is-loading" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Yuborilmoqda..."
                  : "Yuborish"}
              </button>

              <button
                type="button"
                className="button"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Bekor qilish
              </button>
            </footer>
          </form>
        </div>
      </div>

      <ToastContainer />

<style>{`
  .reviews-page {
    background: #F8F3EA;
    min-height: 100vh;
  }

  .reviews-header,
  .review-head,
  .review-total,
  .rating-row {
    display: flex;
    align-items: center;
  }

  .reviews-header,
  .review-total,
  .rating-row {
    justify-content: space-between;
  }

  .review-card {
    width: min(100%, 1000px);
    padding: 24px;
    border: 1px solid #EFE6D6;
    border-radius: 24px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(27,21,18,.04), 0 12px 28px -12px rgba(27,21,18,.18);
    animation: review-in 0.45s ease both;
    transition: transform 0.3s, border-color 0.3s;
  }

  .review-card:hover {
    transform: translateY(-4px);
    border-color: #C81E1E;
  }

  @keyframes review-in {
    from {
      opacity: 0;
      transform: translateY(-16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .review-head {
    gap: 14px;
    margin-bottom: 18px;
  }

  .review-head h3 {
    margin: 0 0 3px;
    color: #1B1512;
    font-size: 1.2rem;
    font-family: 'Fraunces', Georgia, serif;
  }

  .review-head small {
    color: #8A7C6E;
    font-size: 0.9rem;
  }

  .review-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    overflow: hidden;
    border: 3px solid #C81E1E;
    border-radius: 50%;
    background: linear-gradient(135deg, #E63B2E, #C81E1E);
    color: #fff;
    font-size: 24px;
    font-weight: 700;
  }

  .review-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .review-total {
    margin-bottom: 14px;
    padding: 12px 15px;
    border-radius: 10px;
    background: #F8F3EA;
    color: #1B1512;
    font-family: 'Manrope', sans-serif;
  }

  .review-total strong {
    color: #C89B3C;
    font-size: 1.1rem;
    font-family: 'JetBrains Mono', monospace;
  }

  .review-ratings {
    padding: 14px 16px;
    border-radius: 10px;
    background: #F8F3EA;
    border: 1px solid #EFE6D6;
  }

  .rating-row {
    min-height: 30px;
    color: #1B1512;
    font-family: 'Manrope', sans-serif;
  }

  .rating-row:not(:last-child) {
    border-bottom: 1px solid #EFE6D6;
  }

  .stars {
    display: inline-flex;
    gap: 3px;
  }

  .star-on {
    color: #C89B3C;
    text-shadow: 0 1px 2px rgba(200,155,60,.35);
  }

  .star-off {
    color: #EFE6D6;
  }

  .pick-star {
    padding: 0 2px;
    border: 0;
    background: transparent;
    color: #EFE6D6;
    cursor: pointer;
    font-size: 29px;
    transition: transform 0.15s, color 0.15s;
  }

  .pick-star:hover,
  .pick-star.picked {
    color: #C89B3C;
    transform: scale(1.15);
  }

  .review-text {
    margin-top: 17px;
    padding: 16px 18px;
    border-left: 4px solid #C81E1E;
    border-radius: 10px;
    background: #F8F3EA;
    color: #1B1512;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: 'Manrope', sans-serif;
  }

  @media screen and (max-width: 768px) {
    .reviews-header {
      align-items: stretch;
      flex-direction: column;
      gap: 16px;
    }

    .reviews-header .button {
      width: 100%;
      min-height: 50px;
    }

    .review-head,
    .rating-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .review-card {
      padding: 18px;
    }

    .review-avatar {
      width: 48px;
      height: 48px;
      font-size: 20px;
    }

    .pick-star {
      font-size: 26px;
    }
  }
`}</style>
    </div>
  );
}
