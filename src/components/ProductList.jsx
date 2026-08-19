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

          <div className="columns is-multiline">
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
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              maxWidth: "1100px",
              width: "100%",
              margin: "auto",
              padding: "40px",
              position: "relative",
              display: "flex",
              gap: "40px",
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                border: "none",
                background: "#f2f2f2",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ×
            </button>

            <div style={{ flex: 1.2 }}>
              <img
                src={"https://rest.sergosht-api.uz" + activeProduct.image}
                alt={activeProduct.title}
                style={{
                  width: "100%",
                  borderRadius: "16px",
                  objectFit: "contain",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "28px", fontWeight: "700" }}>
                {activeProduct.title}
              </h2>

              <p style={{ fontSize: "18px", marginTop: "10px" }}>
                {activeProduct.price} UZS
              </p>
              
              <p style={{ color: "#777", marginTop: "10px" }}>
                {activeProduct.description}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "30px",
                }}
              >
                <button
                  onClick={() =>
                    setCount((prev) => Math.max(1, prev - 1))
                  }
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f2f2f2",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  −
                </button>

                <span style={{ fontSize: "18px" }}>{count}</span>

                <button
                  onClick={() => setCount((prev) => prev + 1)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f2f2f2",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                style={{
                  marginTop: "30px",
                  width: "100%",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                В корзину : {activeProduct.price * count} UZS
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}