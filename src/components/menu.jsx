import { NavLink } from "react-router";

export default function Menu({ categories = [] }) {
  function getLinkClass({ isActive }) {
    return isActive ? "active" : "";
  }

  return (
    <aside className="menu menu-fixed">
      <p className="menu-label">SAHIFALAR</p>

      <ul className="menu-list">
        <li>
          <NavLink to="/" end className={getLinkClass}>
            Home
          </NavLink>
        </li>

        <li>
          <NavLink to="/delivery" className={getLinkClass}>
            Profil
          </NavLink>
        </li>

        <li>
          <NavLink to="/reviews" className={getLinkClass}>
            Fikrlar
          </NavLink>
        </li>

        <li>
          <NavLink to="/promotions" className={getLinkClass}>
            Aksiyalar
          </NavLink>
        </li>

        <li>
          <NavLink to="/About" className={getLinkClass}>
            Ser Go&apos;sht haqida
          </NavLink>
        </li>

        <li>
          <NavLink to="/Basket" className={getLinkClass}>
            Savat
          </NavLink>
        </li>
      </ul>

      <p className="menu-label menu-label-space">MENU</p>

      <ul className="menu-list">
        {categories.map((category) => (
          <li key={category.id}>
            <a href={`#${category.slug}`}>{category.title}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
