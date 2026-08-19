import { useState } from "react"
import { toast } from 'react-toastify'

export default function Product({ productId, open, photo, title, price, description }) {
    const [isHovered, setIsHovered] = useState(false)

function addToCart(e) {
    e.stopPropagation()
    
    // Анимация кнопки
    const btn = e.target;
    btn.style.transform = 'scale(0.9) rotate(90deg)';
    setTimeout(() => {
      btn.style.transform = 'scale(1) rotate(0deg)';
    }, 200);
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]')

    const isExist = cart.find(product => product.id === productId)

    if (isExist) { 
        cart = cart.map(product => {
            if (product.id === isExist.id) {
                return { ...product, count: product.count + 1 }
            }
            return product
        })
        toast.success(`${title} savatga ${isExist.count} ta mavjud`, {
            position: "bottom-right",
            autoClose: 5000,
            theme: "dark",
        });
    } else {
        cart.push({
            id: productId,
            photo,
            title, 
            price,
            count: 1
        })
        toast.success(`${title} savatga qoshildi`, {
            position: "bottom-right",
            autoClose: 5000,
            theme: "dark",
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Обновляем счётчик в навбаре
    window.dispatchEvent(new Event('storage'));
}

    return (
        <div
            className="product-card"
            onMouseLeave={() => setIsHovered(false)}
            onMouseEnter={() => setIsHovered(true)}
            onClick={open}
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
                    onClick={addToCart}
                    className="product-card-add-btn"
                >
                    +
                </button>
            </div>
            <div className="product-card-content">
                <p className="product-card-title">{title}</p>
                <p className="product-card-price">{price} сум</p>
                {description && (
                    <p className="product-card-description">
                        {description.length > 80 
                            ? description.slice(0, 80) + '...' 
                            : description}
                    </p>
                )}
            </div>
        </div>
    )
}
