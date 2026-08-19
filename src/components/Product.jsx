import { useState } from "react"
import { toast } from 'react-toastify'

export default function Product({ productId, open, photo, title, price, description }) {
    const [isHovered, setIsHovered] = useState(false)

    function addToCart(e) {
        e.stopPropagation()
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
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
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
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart))
    }

    return (
        <div
            onMouseLeave={() => {
                setIsHovered(false)
            }}
            onMouseEnter={() => {
                setIsHovered(true)
            }}
            className="column is-3"
            onClick={open}>

            <div className="card">
                <div className="card-image">
                    <figure className="image is-4by3">
                        <img
                            src={photo}
                            alt="Placeholder image"
                        />
                    </figure>
                </div>
                <div className="card-content">
                    <div className="media">
                        <div className="media-content">
                            <div className="is-flex is-justify-content-space-between">
                                <div>
                                    <p className="title is-4">{title}</p>
                                    <p className="subtitle is-6">{price} сум</p>
                                </div>
                                {isHovered && <button onClick={addToCart} className="button is-dark">+</button>}
                            </div>
                        </div>
                    </div>

                    <div className="content">
                        {description}
                    </div>
                </div>
            </div>
        </div>
    )
}