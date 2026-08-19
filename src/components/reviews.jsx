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
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getUserName(user) {
  if (!user) return "Пользователь";

  const firstName = String(
    user.firstName || user.first_name || user.name || ""
  ).trim();

  const lastName = String(
    user.lastName || user.last_name || user.surname || ""
  ).trim();

  return `${firstName} ${lastName}`.trim() || "Пользователь";
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getReviewUser(review) {
  return review?.user || review?.author || {};
}

function getReviewName(review) {
  return getUserName(getReviewUser(review));
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
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function getReviewTotal(review) {
  return (
    getRating(review, "kitchen") +
    getRating(review, "service") +
    getRating(review, "delivery")
  );
}

function StarDisplay({ value }) {
  return (
    <span className="stars" aria-label={`Оценка: ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((number) => (
        <span
          key={number}
          className={number <= value ? "star-on" : "star-off"}
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
          className={number <= value ? "pick-star picked" : "pick-star"}
          onClick={() => onChange(number)}
          aria-label={`Поставить ${number} из 5`}
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
    } else {
      setHasOrders(false);
    }
  }, []);

  async function loadReviews() {
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/review`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки отзывов: ${response.status}`);
      }

      const data = await response.json();

      setReviews(getList(data, "reviews"));
    } catch (error) {
      console.error("Ошибка получения отзывов:", error);

      toast.error("Не удалось загрузить отзывы", {
        position: "bottom-right",
        autoClose: 3500,
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
      console.error("Ошибка проверки заказов:", error);
      setHasOrders(false);
    }
  }

  function openModal() {
    const savedUser = getUser();

    if (!savedUser?.token) {
      toast.warning("Сначала войдите в профиль, чтобы оставить отзыв", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });
      return;
    }

    if (!hasOrders) {
      toast.warning("Сначала сделайте хотя бы один заказ", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });
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
      toast.warning("Сначала войдите в профиль", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });
      closeModal();
      return;
    }

    if (!hasOrders) {
      toast.warning("Сначала сделайте заказ", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });
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
      toast.error("Поставьте все три оценки", {
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.detail ||
          `Сервер вернул ошибку ${response.status}`;

        throw new Error(message);
      }

      closeModal();

      toast.success("Спасибо! Ваш отзыв опубликован.", {
        position: "bottom-right",
        autoClose: 3500,
        theme: "dark",
      });

      await loadReviews();
    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);

      toast.error(
        error.message || "Не удалось отправить отзыв. Попробуйте позже.",
        {
          position: "bottom-right",
          autoClose: 4500,
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
        <nav className="breadcrumb" aria-label="breadcrumbs">
          <ul>
            <li>
              <NavLink to="/">Bosh sahifa</NavLink>
            </li>
          </ul>
        </nav>

        <div className="reviews-header mb-5">
          <div>
            <h1 className="title">Fikrlar</h1>
            <p className="subtitle is-6">Пользовательские отзывы</p>
          </div>

          <button
            type="button"
            className="button is-danger"
            onClick={openModal}
          >
            Fikr qoldirish
          </button>
        </div>

        {!user?.token && (
          <div className="notification is-light mb-5">
            Чтобы оставить отзыв, сначала войдите в профиль.
          </div>
        )}

        {isLoading && (
          <progress className="progress is-danger" max="100">
            Загрузка
          </progress>
        )}

        {!isLoading && reviews.length === 0 && (
          <div className="box has-text-centered py-6">
            <h2 className="title is-4">Пока нет отзывов</h2>
            <p className="has-text-grey">
              Будьте первым, кто оставит отзыв после заказа.
            </p>
          </div>
        )}

        {reviews.map((review) => {
          const reviewUser = getReviewUser(review);
          const name = getReviewName(review);
          const text = getReviewText(review);
          const date = formatDate(getReviewDate(review));
          const total = getReviewTotal(review);

          return (
            <article className="review-card review-animation mb-5" key={review.id}>
              <div className="review-head">
                <div className="review-avatar">
                  {reviewUser.photo ? (
                    <img
                      src={`${API}${reviewUser.photo}`}
                      alt={name}
                      loading="lazy"
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
                  <div className="rating-row" key={category.key}>
                    <span>{category.label}</span>

                    <StarDisplay value={getRating(review, category.key)} />
                  </div>
                ))}
              </div>

              {text && <p className="review-text">{text}</p>}
            </article>
          );
        })}
      </main>

      <div className={`modal ${isModalOpen ? "is-active" : ""}`}>
        <div className="modal-background" onClick={closeModal} />

        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Fikr qoldirish</p>

            <button
              type="button"
              className="delete"
              onClick={closeModal}
              aria-label="Закрыть"
              disabled={isSubmitting}
            />
          </header>

          <form onSubmit={submitReview}>
            <section className="modal-card-body">
              <p className="mb-4">
                Отзыв будет опубликован от имени:{" "}
                <strong>{getUserName(user)}</strong>
              </p>

              {CATEGORIES.map((category) => (
                <div className="field" key={category.key}>
                  <label className="label">{category.label}</label>

                  <StarPicker
                    value={ratings[category.key]}
                    onChange={(value) => setRating(category.key, value)}
                  />
                </div>
              ))}

              <div className="field">
                <label className="label">Fikringiz</label>

                <textarea
                  className="textarea"
                  value={comment}
                  maxLength={300}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Fikringizni yozing..."
                  required
                />

                <p className="help has-text-right">{comment.length}/300</p>
              </div>
            </section>

            <footer className="modal-card-foot">
              <button
                type="submit"
                className={`button is-danger ${
                  isSubmitting ? "is-loading" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
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
    </div>
  );
}
