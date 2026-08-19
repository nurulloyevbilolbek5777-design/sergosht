import { useState, useEffect } from "react"
import Menu from "./menu"
import Navbar from "./Navbar"
import ProductList from "./ProductList"
import { Swiper, SwiperSlide } from "swiper/react"
import { ToastContainer} from 'react-toastify'

import "swiper/css"
import "swiper/css/navigation"

import { Navigation } from "swiper/modules"

export default function Home() {
  const [categories, setCategories] = useState([])
  const [slides, setSlides] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(null)

  useEffect(() => {
    fetch("https://rest.sergosht-api.uz/api/categories/?with_products=1")
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [])

  useEffect(() => {
    fetch("https://rest.sergosht-api.uz/api/slider/")
      .then(res => res.json())
      .then(data => setSlides(data))
      .catch(err => console.error(err))
  }, [])

  const openModal = (slide) => {
    setActiveSlide(slide)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setActiveSlide(null)
  }

  return (
    <div>
      <Navbar />

      <div className={`modal ${isModalOpen ? "is-active" : ""}`}>
        <div className="modal-background" onClick={closeModal}></div>

        <div className="modal-content" style={{ maxWidth: "900px" }}>
          {activeSlide && (
            <div className="card">
              <div className="card-image">
                <figure className="image is-16by9">
                  <img
                    src={activeSlide.image}
                    alt={activeSlide.title || "promo"}
                  />
                </figure>
              </div>

              {(activeSlide.title || activeSlide.text) && (
                <div className="card-content">
                  {activeSlide.title && (
                    <p className="title is-4">{activeSlide.title}</p>
                  )}
                  {activeSlide.text && (
                    <p className="content">{activeSlide.text}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={closeModal}
        ></button>
      </div>
      
      <div className="container mt-5">
        <div className="columns">
          <div className="column is-2">
            <Menu categories={categories} />
          </div>
          <div className="column is-10">
            <div className="row mb-6">
              <Swiper navigation modules={[Navigation]}>
                {slides.map(slide => (
                  <SwiperSlide key={slide.id}>
                    <img
                      onClick={() => openModal(slide)}   
                      style={{
                        width: "100%",
                        height: "auto",
                        cursor: "pointer"
                      }}
                      src={slide.image}
                      alt={`Slide ${slide.id}`}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {categories.map(category => (
                <ProductList
                  key={category.id}
                  products={category.products}
                  title={category.title}
                  slug={category.slug}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}