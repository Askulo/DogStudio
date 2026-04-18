import { useEffect, useState } from "react";
import "../styles/LoadingScreen.css";

export default function LoadingScreen({ isLoading }) {
  const [displayLoading, setDisplayLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Add a slight delay before hiding to smooth the transition
      const timer = setTimeout(() => {
        setDisplayLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayLoading(true);
    }
  }, [isLoading]);

  if (!displayLoading) return null;

  return (
    <div className={`loading-screen ${!isLoading ? "fade-out" : ""}`}>
      <div className="loading-container">
        <div className="loader">
          <div className="spinner"></div>
        </div>
        <h2>Loading Experience</h2>
        <p>Preparing 3D assets...</p>
      </div>
    </div>
  );
}
