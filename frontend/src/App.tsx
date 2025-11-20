import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import WalletConnection from "./components/WalletConnection";
import Home from "./pages/Home";
import Stake from "./pages/Stake";
import Mint from "./pages/Mint";
import SayHello, { StakeUI } from "./pages/SayHello";

function App() {
  return (
    <BrowserRouter>
      <WalletConnection />   {/* Wallet always visible */}

      <nav style={{ display: "flex", gap: "20px", padding: "10px" }}>
        <Link to="/">Home</Link>
        <Link to="/stake">Stake</Link>
        <Link to="/mint">Mint</Link>
        <Link to="/contract">Contract</Link>
        <Link to="/staketoken">Stake</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stake" element={<Stake />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/contract" element={<SayHello />} />
        <Route path="/staketoken" element={<StakeUI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
