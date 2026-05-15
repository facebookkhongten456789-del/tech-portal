"use client";

import { useState, useEffect } from "react";

export default function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open");
      setIsOpen(!isOpen);
    }
  };

  // Close when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebar = document.querySelector(".sidebar");
      const btn = document.querySelector(".mobile-menu-btn");
      if (sidebar?.classList.contains("open") && !sidebar.contains(e.target as Node) && !btn?.contains(e.target as Node)) {
        sidebar.classList.remove("open");
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <button 
      className="mobile-menu-btn btn btn-ghost" 
      onClick={toggle}
      style={{
        fontSize: "20px",
        padding: "8px",
        marginRight: "12px",
      }}
    >
      {isOpen ? "✕" : "☰"}
    </button>
  );
}
