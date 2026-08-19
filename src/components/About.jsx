import { useState, useEffect } from "react"
import Menu from "./menu"
import Navbar from "./Navbar"
import ProductList from "./ProductList"

export default function About() {
  return (
    <div>
      <Navbar />

      <div className="container mt-5">
        <div className="columns">
          <div className="column">
            2018 yilda mo`jazgina oshxonada oddiy qiziqish va yuksak ishonch bilan boshlangan harakatlar – o`z mevasini berdi. Asoschi tomonidan tinim bilmay qilingan mehnatlar samarasini xodimlar soni 100 nafardan ortganligi, samimiy 100 000 ziyod mijozlar tanlovi, shuningdek filiallar soni yildan yilga o`sishida aks ettiradi.
            Mana yillar o’tibdiki oilaviy qadriyatlarga amal qilgan holda, taomlarni tayyorlash mahoratimizni rivojlantirib bormoqdamiz. Avvaliga 1 gina maxsulotdan boshlangan bo`lsa – hozirda keng tanlovli assortimentga ega bo`lingan. Barcha uchun qaygʻurib betakror muhitni yaratmoqdamiz.
            7 yoshdan - 70 yoshgacha har qanday mehmonlarimizga samimiy munosabat bildirgan holda, taomlarimiz eng yuqori sifatdagi tabiiy maxsulotlardan va standartlar asosida tayyorlanishini kafolatlaymiz.
          </div>
        </div>
      </div>
    </div>
  )
}