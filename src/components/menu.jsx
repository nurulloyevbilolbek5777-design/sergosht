import { NavLink } from "react-router";

export default function Menu({ categories }) {
  return (
    <aside className="menu menu-fixed">

      <p className="menu-label">Sahifalar</p>
      <ul className="menu-list">
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/delivery">профиль</NavLink></li>
        <li><NavLink to="/reviews">отзывы</NavLink></li>
        <li><NavLink to="/promotions">акции</NavLink></li>
        <li><NavLink to="/About">про Sergo'sht</NavLink></li>
        <li><NavLink to="/Basket">корзина</NavLink></li>
      </ul>
       <p className="menu-label">Menu</p>
      <ul className="menu-list">
        {categories.map(category => (
          <li key={category.id}><a href={`#${category.slug}`}>{category.title}</a></li>
        ))}
      </ul>
    </aside>
  )
}