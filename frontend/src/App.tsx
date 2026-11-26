import { useState } from "react";
import "./App.css";

function App() {
  const [bubbleName, setBubbleName] = useState("");
  const [createdBubble, setCreatedBubble] = useState("");

  function handleCreateBubble(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bubbleName.trim()) {
      return;
    }

    // Temporary: we'll connect this to the backend later
    setCreatedBubble(bubbleName.trim());
    setBubbleName("");
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>bubbles<span>.</span></h1>
        <span className="admin-label">ADMIN PORTAL</span>
      </header>

      <main className="admin-content">
        <div className="welcome-section">
          <p className="eyebrow">ADMIN DASHBOARD</p>
          <h2>Create a Bubble</h2>
          <p>
            Set up a new Bubble for users to join through the mobile app.
          </p>
        </div>

        <section className="create-card">
          <h3>New Bubble</h3>
          <p className="card-description">
            Enter a name for the Bubble you want to create.
          </p>

          <form onSubmit={handleCreateBubble}>
            <label htmlFor="bubbleName">Bubble name</label>

            <input
              id="bubbleName"
              type="text"
              placeholder="e.g. Weekend Adventures"
              value={bubbleName}
              onChange={(event) => setBubbleName(event.target.value)}
              required
            />

            <button type="submit">
              Create Bubble
            </button>
          </form>

          {createdBubble && (
            <div className="success-message">
              <h3>Bubble created successfully!</h3>
              <p>{createdBubble}</p>
              <small>
                Your Bubble has been created locally.
                Backend connection coming next.
              </small>
            </div>
          )}
        </section>
      </main>

      <footer>
        Bubbles Admin Portal
      </footer>
    </div>
  );
}

export default App;
