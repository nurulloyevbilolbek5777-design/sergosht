import { useState } from "react";
import Product from "./Product";
import { toast } from "react-toastify";

export default function ProductList({ products, slug, title }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [count, setCount] = useState(1);

  function openModal(product) {
    setActiveProduct(product);
    setCount(1);
    setIsModalOpen(true);
  }

  function addToCart() {
    if (!activeProduct) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existProduct = cart.find(
      (item) => item.id === activeProduct.id
    );

    if (existProduct) {
      existProduct.count += count;
    } else {
      cart.push({
        id: activeProduct.id,
        title: activeProduct.title,
        price: activeProduct.price,
        description: activeProduct.description,
        photo: "https://rest.sergosht-api.uz" + activeProduct.image,
        count: count,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    toast.success(`${activeProduct.title} добавлен в корзину`, {
      position: "bottom-right",
      autoClose: 3000,
      theme: "dark",
    });

    setIsModalOpen(false);
  }

  return (
    <>
      <div className="row mb-6" id={slug}>
        <div className="block">
          <h2 className="title">{title}</h2>

          <div className="product-grid">
            {products.map((product) => (
              <Product
                key={product.id}
                open={() => openModal(product)}
                productId={product.id}
                title={product.title}
                price={product.price}
                description={product.description}
                photo={"https://rest.sergosht-api.uz" + product.image}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`modal ${isModalOpen ? "is-active" : ""}`}>
        <div
          className="modal-background"
          onClick={() => setIsModalOpen(false)}
        />

        {activeProduct && (
          <div className="product-modal-content">
            <button
              onClick={() => setIsModalOpen(false)}
              className="product-modal-close"
            >
              ×
            </button>

            <div className="product-modal-image">
              <img
                src={"https://rest.sergosht-api.uz" + activeProduct.image}
                alt={activeProduct.title}
                loading="lazy"
              />
            </div>

            <div className="product-modal-info">
              <h2 className="product-modal-title">
                {activeProduct.title}
              </h2>

              <p className="product-modal-price">
                {activeProduct.price} сум
              </p>
              
              <p className="product-modal-description">
                {activeProduct.description}
              </p>

              <div className="product-modal-actions">
                <div className="product-modal-counter">
                  <button
                    onClick={() =>
                      setCount((prev) => Math.max(1, prev - 1))
                    }
                  >
                    −
                  </button>

                  <span>{count}</span>

                  <button
                    onClick={() => setCount((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  className="product-modal-add-btn"
                >
                  В корзину: {activeProduct.price * count} сум
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
