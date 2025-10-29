import React, { useState, useRef } from "react";
import { useCircuitStore } from "../store/circuitStore";

const DraggableComponent = ({ component, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const {
    updateComponentPosition,
    removeComponent,
    selectedComponent,
    selectComponent,
    zoom,
  } = useCircuitStore();
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left click

    const rect = dragRef.current.getBoundingClientRect();
    const canvasRect = dragRef.current
      .closest(".canvas-area")
      .getBoundingClientRect();

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setIsDragging(true);
    selectComponent(component.id);

    // Prevent text selection
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return; // Only handle single touch

    const touch = e.touches[0];
    const rect = dragRef.current.getBoundingClientRect();
    const canvasRect = dragRef.current
      .closest(".canvas-area")
      .getBoundingClientRect();

    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    setIsDragging(true);
    selectComponent(component.id);

    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

  const canvasRect = dragRef.current.closest(".canvas-area").getBoundingClientRect();
  // Perhitungkan zoom agar posisi komponen tepat di bawah kursor
  const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
  const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;
  updateComponentPosition(component.id, { x: newX, y: newY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const canvasRect = dragRef.current.closest(".canvas-area").getBoundingClientRect();
  // Perhitungkan zoom agar posisi komponen tepat di bawah kursor
  const newX = (touch.clientX - canvasRect.left - dragOffset.x) / zoom;
  const newY = (touch.clientY - canvasRect.top - dragOffset.y) / zoom;
  updateComponentPosition(component.id, { x: newX, y: newY });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (window.confirm(`Hapus komponen ${component.type}?`)) {
      removeComponent(component.id);
    }
  };

  const longPressTimer = useRef(null);

  const handleLongPress = () => {
    if (window.confirm(`Hapus komponen ${component.type}?`)) {
      removeComponent(component.id);
    }
  };

  const startLongPress = () => {
    longPressTimer.current = setTimeout(handleLongPress, 800);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Delete" && selectedComponent === component.id) {
      removeComponent(component.id);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleKeyDown);

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleKeyDown);

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={dragRef}
      className={`absolute cursor-move select-none transition-shadow ${
        isDragging ? "shadow-lg scale-105 z-50" : "hover:shadow-md"
      } ${selectedComponent === component.id ? "ring-2 ring-blue-500" : ""}`}
      style={{
        left: component.position.x,
        top: component.position.y,
        transform: isDragging ? "rotate(2deg)" : "rotate(0deg)",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        handleTouchStart(e);
        startLongPress();
      }}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

export default DraggableComponent;
