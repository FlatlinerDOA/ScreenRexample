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
    }, 1000)

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
      <h1>Vite + React</h1>
      <div className="card"> 
        <RecorderComponent />
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)} className="mt-4" >
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App