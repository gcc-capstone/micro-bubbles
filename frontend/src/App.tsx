import { useState } from "react";
import "./App.css";

const bubbleColors = [
  "#3E8ED0", // Blue
  "#2F9AA6", // Teal
  "#3E9E70", // Green
  "#8C6BC8", // Purple
  "#D9822F", // Orange
  "#D9638A", // Pink
];

function App() {
  const [bubbleName, setBubbleName] = useState("");
  const [selectedColor, setSelectedColor] = useState(bubbleColors[0]);
  const [createdBubble, setCreatedBubble] = useState("");

  function handleCreateBubble(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = bubbleName.trim();

    if (!trimmedName) return;

    // Temporary: this will connect to the backend later.
    setCreatedBubble(trimmedName);
    setBubbleName("");
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>
          bubbles<span>.</span>
        </h1>
        <span className="admin-label">ADMIN PORTAL</span>
      </header>

      <main className="admin-content">
        <section className="welcome-section">
          <p className="eyebrow">ADMIN DASHBOARD</p>
          <h2>Create a Bubble</h2>
          <p>
            Set up a new Bubble for users to join through their mobile app with the QR code.
          </p>
        </section>

        <section className="create-card">
          <div className="form-section">
            <h3>New Bubble</h3>
            <p className="card-description">
              Customize your Bubble before creating it.
            </p>

            <form onSubmit={handleCreateBubble}>
              <label htmlFor="bubbleName">Bubble name</label>
              <input
                id="bubbleName"
                type="text"
                placeholder="e.g. Cabin 14"
                value={bubbleName}
                onChange={(event) => setBubbleName(event.target.value)}
                required
              />

              <label id="bubble-color-label">Bubble color</label>
              <div
                className="color-picker"
                role="group"
                aria-labelledby="bubble-color-label"
              >
                {bubbleColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${
                      selectedColor === color ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Choose ${color}`}
                    aria-pressed={selectedColor === color}
                  />
                ))}
              </div>

              <button className="create-button" type="submit">
                Create Bubble
              </button>
            </form>
          </div>

          <div className="preview-section">
            <p className="preview-label">YOUR BUBBLE</p>

            <div className="bubble-preview-area">
              <div
                className="bubble-preview"
                style={{
                  "--bubble-color": selectedColor,
                } as React.CSSProperties}
              >
                <div className="bubble-rim" />
                <div className="bubble-reflection" />
                <div className="bubble-bounce" />
                <div className="bubble-glint" />
                <span className="bubble-preview-name">
                  {bubbleName.trim() || "Bubble Name"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {createdBubble && (
          <div className="success-message">
            <h3>Bubble created successfully!</h3>
            <p>{createdBubble}</p>
            <small>
              This is a local preview only. Database connection coming next.
            </small>
          </div>
        )}
      </main>

      <footer>Bubbles Admin Portal</footer>
    </div>
  );
}

export default App;
