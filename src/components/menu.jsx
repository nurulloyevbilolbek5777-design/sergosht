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
      <aside className="menu premium-menu">
        <div className="premium-menu-pages">
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
        </div>

        <div className="premium-menu-products">
          <p className="menu-label menu-label-space">
            MENU
          </p>

          <div className="premium-menu-scroll">
            <ul className="menu-list">
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
          </div>
        </div>
      </aside>

      <style>{`
        .premium-menu {
          border: 1px solid var(--cream-deep);
          border-radius: var(--radius-m);
          background: #fff;
          box-shadow: var(--shadow-card);
          padding: 14px;
        }

        @media screen and (min-width: 1025px) {
          .premium-menu {
            position: fixed;
            top: 102px;
            width: 210px;
            max-height: calc(100vh - 122px);
            overflow-x: hidden;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(200, 30, 30, .45) transparent;
          }

          .premium-menu::-webkit-scrollbar {
            width: 5px;
          }

          .premium-menu::-webkit-scrollbar-track {
            background: transparent;
          }

          .premium-menu::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(200, 30, 30, .42);
          }

          .premium-menu::-webkit-scrollbar-thumb:hover {
            background: var(--ember);
          }
        }

        @media screen and (max-width: 1024px) {
          .premium-menu {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            border-radius: 14px;
            padding: 10px;
          }

          .premium-menu-pages,
          .premium-menu-products {
            max-width: 100%;
            overflow: hidden;
          }

          .premium-menu .menu-label {
            display: none;
          }

          .premium-menu .menu-list {
            display: flex;
            width: max-content;
            max-width: none;
            gap: 7px;
            margin: 0;
          }

          .premium-menu .menu-list li {
            flex: 0 0 auto;
            margin: 0;
          }

          .premium-menu .menu-list a {
            padding: 9px 13px;
            white-space: nowrap;
          }

          .premium-menu-pages {
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 7px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .premium-menu-products {
            overflow-x: auto;
            overflow-y: hidden;
            padding-top: 7px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .premium-menu-pages::-webkit-scrollbar,
          .premium-menu-products::-webkit-scrollbar {
            display: none;
          }

          .premium-menu-scroll {
            width: max-content;
          }
        }

        body.dark-theme .premium-menu {
          border-color: #423129;
          background: #251b17;
        }

        body.dark-theme .premium-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 98, 88, .55);
        }
      `}</style>
    </>
  );
}
