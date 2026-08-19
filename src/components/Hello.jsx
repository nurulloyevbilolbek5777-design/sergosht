import {useState} from 'react'

export default function Hello () {
    const [name, setName] = useState("")
    const [year, setYear] = useState("")


function handleInput (e) {
setName(e.target.value)
}

function handleYear (e) {
setYear(e.target.value)
}

return (
<>
<div>
<label>Ваше имя</label>
<input value={name} onInput={handleInput} type="text" />
</div>

<div>
<label>ваш возраст</label>
<input value={year} onInput={handleYear} type="text" />
</div>

<h2>Привет, {name.length > 0 ? name : 'гость!'}</h2>
<h2>тебе, {year.length > 0 ? 2026 - year : '?'} лет</h2>
</>
)
}
