import { useState } from "react"

function Car ({name = "Tahoe", km = 1}) {
    const [km1, setkm] = useState(km)

    const adKm = (a) => {
        setkm(numb => numb + a)
    }

    return (
        <div style={{
            padding: "20px",
            background: "#f0f0f0",
            borderRadius: "10px",
            marginBottom: "10px"
        }}>
            <h1>название машины: {name}</h1>
            <h2>пробег: {km1}</h2>
            <button onClick={() => adKm(1)}>+1</button>
            <button onClick={() => adKm(10)}>+10</button>
            <button onClick={() => adKm(100)}>+100</button>
            <button onClick={() => adKm(1000)}>+1000</button>
        </div>
    )
}

export default Car