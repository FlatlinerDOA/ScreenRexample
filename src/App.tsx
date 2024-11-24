import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useState, useEffect } from 'react';
import RecorderComponent from './RecorderComponent';

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const x = setInterval(() => {
      setCount(p => p + 1);
    }, 10)

    return () => {
      clearInterval(x);
    }
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Screen Recording Demo</h1>
      <div className="card"> 
        <RecorderComponent />
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)} className="mt-4" >
          Count is {(count * 0.01).toFixed(2)}
        </button>
      </div>
      <p className="read-the-docs">
        Click to start recording your screen.
      </p>
    </>
  )
}

export default App
