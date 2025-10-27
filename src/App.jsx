import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import html2canvas from "html2canvas";

const App = () => {
  const [gridSize, setGridSize] = useState(16);
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [pixels, setPixels] = useState(Array(16 * 16).fill("#ffffff"));
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const [recentColors, setRecentColors] = useState(["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]);
  const gridRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handlePixelPaint = (index, color) => {
    setPixels(prevPixels => {
  const newPixels = [...prevPixels];
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  if (brushSize === 1) {
    newPixels[index] = color;
  } else if (brushSize === 2) {
    const positions = [
      [row, col],
      [row, col + 1],
      [row + 1, col],
      [row + 1, col + 1]
    ];
    positions.forEach(([r, c]) => {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        const brushIndex = r * gridSize + c;
        newPixels[brushIndex] = color;
      }
    });
  } else if (brushSize === 3) {
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          const brushIndex = r * gridSize + c;
          newPixels[brushIndex] = color;
        }
      }
    }
  }

  saveToHistory(newPixels); 
  return prevPixels; 
});

  };

  const saveToHistory = (newPixels) => {
    setHistory((prev) => [...prev, pixels]); 
    setRedoStack([]); 
    setPixels(newPixels);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRedoStack((prev) => [...prev, pixels]);
    setPixels(lastState);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, pixels]);
    setPixels(nextState);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const handleExport = () => {
    const grid = gridRef.current;
    html2canvas(grid, {
      backgroundColor: null,
      scale: 2
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "pixel-art.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const handleMouseDown = (index, e) => {
    e.preventDefault();
    
    if (e.button === 2) { 
      setIsErasing(true);
      handlePixelPaint(index, "#ffffff");
    } else { 
      setIsDrawing(true);
      handlePixelPaint(index, selectedColor);
    }
  };

  const handleMouseEnter = (index) => {
    if (isDrawing) {
      handlePixelPaint(index, selectedColor);
    } else if (isErasing) {
      handlePixelPaint(index, "#ffffff");
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsErasing(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false);
      setIsErasing(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleClear = () => {
    setPixels(Array(gridSize * gridSize).fill("#ffffff"));
  };

  const handleGridSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setGridSize(newSize);
    setPixels(Array(newSize * newSize).fill("#ffffff"));
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (!recentColors.includes(color)) {
      const newRecent = [color, ...recentColors.slice(0, 4)];
      setRecentColors(newRecent);
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <div className="title-section">
          <h1>🎨 Pixel Art Creator</h1>
          <p style={{ fontSize: "0.9rem", color: "#4f46e5" }}>Click and drag to draw • Right-click to erase</p>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>

        </div>
      </div>

      <div className="main-container">
        <div className="toolbar">
          <div className="tool-section">
            <h3>Canvas</h3>
            <div className="tool-group">
              <label>
                <h3>Grid Size</h3>
                <select value={gridSize} onChange={handleGridSizeChange}>
                  <option value="8">8 × 8</option>
                  <option value="16">16 × 16</option>
                  <option value="32">32 × 32</option>
                  <option value="48">48 × 48</option>
                  <option value="64">64 × 64</option>
                </select>
              </label>
            </div>
            
            <div className="tool-group">
              <label>
                <h3>Brush Size: {brushSize}×{brushSize}</h3> 
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
              </label>
              <div className="brush-preview">
                <div className="brush-size-info" style={{color:"#4f46e5"}}>
                  {brushSize === 1 && "Single pixel"}
                  {brushSize === 2 && "2×2 pixels"}
                  {brushSize === 3 && "3×3 pixels"}
                </div>
              </div>
            </div>

            <div className="tool-group">
              <h3>Double click to undo/redo</h3>
              <button className="undo-button" onClick={handleUndo}>Undo</button>
              <button className="redo-button" onClick={handleRedo}>Redo</button>
            </div>

          </div>

          <div className="tool-section">
            <h3>Selected Color</h3>
            <div className="color-picker-container">
              <input
                type="color"
                value={selectedColor}
                className="color-picker"
                onChange={(e) => handleColorSelect(e.target.value)}
              />
              <div className="selected-color-info">
                <span style={{ color: "#4f46e5" }}>{selectedColor}</span>
              </div>
            </div>
            
            <div className="recent-colors">
              <h3>Colour Palette</h3>
              <div className="color-palette">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-swatch ${color === selectedColor ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>

            <div className="color-picker-section">
              <p>Color Picker</p>
              <div className="custom-color-picker">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="large-color-picker"
                />
                <div className="color-inputs">
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    placeholder="#000000"
                    className="color-hex-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="tool-section">
            <h3>Actions</h3>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleClear}>
                🗑️ Clear Canvas
              </button>
              <button className="btn btn-primary" onClick={handleExport}>
                📥 Export PNG
              </button>
            </div>
          </div>
        </div>
        

        <div className="canvas-container">
          <div 
            ref={gridRef}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseLeave={handleMouseUp}
          >
            {pixels.map((color, index) => (
              <div
                key={index}
                className="pixel"
                style={{ backgroundColor: color }}
                onMouseDown={(e) => handleMouseDown(index, e)}
                onMouseEnter={() => handleMouseEnter(index)}
                onContextMenu={(e) => e.preventDefault()}
              />
            ))}
          </div>
          
          <div className="canvas-info" style={{color: "#4f46e5"}}>
            <span>{gridSize} × {gridSize} Grid</span>
            <span>• Brush: {brushSize}×{brushSize}</span>
            <span>• Right-click to erase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;