"use client"

import { useState, useEffect } from "react"

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return { darkMode, toggleDarkMode }
}
