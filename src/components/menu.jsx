import { useEffect, useState } from "react";
import { NavLink } from "react-router";

export default function Menu({ categories = [] }) {
  const [activeCategory, setActiveCategory] = useState("");

  function getLinkClass({ isActive }) {
    return isActive ? "active" : "";
  }

  useEffect(() => {
    if (!categories.length) return;

    const observers = [];

    categories.forEach((category) => {
      const element = document.getElementById(category.slug);

      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategory(category.slug);
          }
        },
        {
          rootMargin: "-20% 0px -65% 0px",
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => {
        observer.disconnect();
      });
    };
  }, [categories]);

  function scrollToCategory(event, slug) {
    event.preventDefault();

    const element = document.getElementById(slug);

    if (!element) return;

    setActiveCategory(slug);

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <aside className="menu menu-fixed permanent-side-menu">
        <p className="menu-label">SAHIFALAR</p>

        <ul className="menu-list">
          <li>
            <NavLink
              to="/"
              end
              className={getLinkClass}
            >
              Home
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/delivery"
              className={getLinkClass}
            >
              Profil
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/reviews"
              className={getLinkClass}
            >
              Fikrlar
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/promotions"
              className={getLinkClass}
            >
              Aksiyalar
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/About"
              className={getLinkClass}
            >
              Ser Go&apos;sht haqida
            </NavLink>
          </li>
        </ul>

        <p className="menu-label menu-label-space">
          MENU
        </p>

        <ul className="menu-list menu-products-list">
          {categories.map((category) => (
            <li key={category.id}>
              <a
                href={`#${category.slug}`}
                className={
                  activeCategory === category.slug
                    ? "active"
                    : ""
                }
                onClick={(event) =>
                  scrollToCategory(
                    event,
                    category.slug
                  )
                }
              >
                {category.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <style>{`
        @media screen and (min-width: 1025px) {
          .permanent-side-menu {
            position: fixed !important;
            top: 102px !important;
            width: 210px;
            max-height: calc(100vh - 122px);
            overflow-x: hidden !important;
            overflow-y: auto !important;
            scrollbar-width: thin;
            scrollbar-color: rgba(200, 30, 30, .45) transparent;
          }

          .permanent-side-menu::-webkit-scrollbar {
            width: 5px;
          }

          .permanent-side-menu::-webkit-scrollbar-track {
            background: transparent;
          }

          .permanent-side-menu::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(200, 30, 30, .42);
          }

          .permanent-side-menu::-webkit-scrollbar-thumb:hover {
            background: var(--ember);
          }
        }

        @media screen and (max-width: 1024px) {
          .permanent-side-menu {
            position: static !important;
            width: 100%;
            max-height: none;
            overflow: visible !important;
          }
        }

        body.dark-theme .permanent-side-menu {
          scrollbar-color: rgba(255, 98, 88, .55) transparent;
        }

        body.dark-theme
          .permanent-side-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 98, 88, .55);
        }
      `}</style>
    </>
  );
}
