import './App.css';
import ContentPage from './pages/ContentPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img className="utn-logo" src="/utn_logo.png" alt="Logo UTN" />
        <div className="header-title">
          <h1>UTN FRVM - Investigación Operativa - Grupo 16</h1>
          <h2>Trabajo Práctico Integrador - Modelo de red</h2>
          <p className="teachers">Docentes: Dra. Ing. Mercedes Soria · Dra. Ing. Laura Tosselli</p>
        </div>
      </header>
      <main className="App-content">
        <ContentPage />
      </main>
    </div>
  );
}

export default App;
