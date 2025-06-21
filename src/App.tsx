import { Header } from "./components/Header"
import { TipForm } from "./components/RfpForm"

function App() {
  return (
    <div className="min-h-screen bg-canvas-cream">
      {/* Poster-style header */}
      <Header />

      {/* Main content with poster spacing */}
      <main className="poster-container">
        <TipForm />
      </main>
    </div>
  )
}

export default App

