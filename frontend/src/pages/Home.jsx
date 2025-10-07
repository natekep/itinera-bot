import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h1>Welcome to the App</h1>
      <Link to="/maps" className="btn">
        Go to Maps
      </Link>
    </div>
  );
}
