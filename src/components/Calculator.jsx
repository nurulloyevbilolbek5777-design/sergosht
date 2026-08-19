import { useState } from "react"

export default function Calculator() {
const [number, setNumber] = useState(0)


const plusOne = (a) => {
setNumber(number + a)
}

return (
<>
<h1>Calculator</h1>
<h2>{number}</h2>
<button onClick={() => plusOne(1)}>Прибавить 1</button>
<button onClick={() => plusOne(10)}>Прибавить 10</button>
<button onClick={() => plusOne(100)}>Прибавить 100</button>
</>
)
}

