import './App.css';
import ContentPage from './pages/ContentPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Investigación Operativa - UTN FRVM</h1>
        <h2>Trabajo Práctico Integrador</h2>
        <h3>Modelo de red - Arbol de expansión mínimo</h3>
      </header>
      <main className="App-content">
        <ContentPage />
      </main>
    </div>
  );
}

export default App;
