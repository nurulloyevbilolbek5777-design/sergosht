import { toast } from "react-toastify";

function getCartFromStorage() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("ru-RU");
}

export default function Product({
  productId,
  open,
  photo,
  title,
  price,
  description,
}) {
  function addToCart(event) {
    event.stopPropagation();

    const button = event.currentTarget;

    button.classList.remove("is-added");

    requestAnimationFrame(() => {
      button.classList.add("is-added");
    });

    let cart = getCartFromStorage();

    const existingProduct = cart.find(
      (product) => product.id === productId
    );

    let newCount = 1;

    if (existingProduct) {
      newCount = Number(existingProduct.count || 1) + 1;

      cart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            count: newCount,
          };
        }

        return product;
      });
    } else {
      cart.push({
        id: productId,
        photo,
        title,
        price,
        description,
        count: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("storage"));

    toast.success(
      existingProduct
        ? `В корзине ${newCount} шт. «${title}»`
        : `«${title}» добавлен в корзину`,
      {
        position: "bottom-right",
        autoClose: 2500,
        theme: "dark",
      }
    );
  }

  return (
    <article
      className="product-card"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      aria-label={`Открыть товар ${title}`}
    >
      <div className="product-card-image">
        <figure className="image is-4by3">
          <img
            src={photo}
            alt={title}
            loading="lazy"
          />
        </figure>

        <button
          type="button"
          onClick={addToCart}
          className="product-card-add-btn"
          aria-label={`Добавить ${title} в корзину`}
          title="Добавить в корзину"
        >
          +
        </button>
      </div>

      <div className="product-card-content">
        <p className="product-card-title" title={title}>
          {title}
        </p>

        <p className="product-card-price">
          {formatPrice(price)} сум
        </p>

        {description && (
          <p className="product-card-description">
            {description.length > 85
              ? `${description.slice(0, 85)}...`
              : description}
          </p>
        )}
      </div>

      <style>{`
        .product-card-add-btn.is-added {
          animation: product-add-animation .35s var(--ease-out);
        }

        @keyframes product-add-animation {
          0% {
            transform: scale(1) rotate(0deg);
          }

          45% {
            transform: scale(.82) rotate(90deg);
          }

          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .product-card {
          outline: none;
        }

        .product-card:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 4px;
        }

        .product-card-add-btn {
          -webkit-tap-highlight-color: transparent;
        }

        @media screen and (max-width: 768px) {
          .product-card-add-btn {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </article>
  );
}
