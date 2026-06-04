"use client"

import { useEffect } from "react"

export function useScrollAnimation() {
  useEffect(() => {
    // Đặt timeout nhỏ để đảm bảo DOM đã render xong
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible")
              observer.unobserve(entry.target)
            }
          })
        },
        { 
          threshold: 0.05,
          rootMargin: "0px 0px -30px 0px"
        }
      )

      const elements = document.querySelectorAll(".fade-up")
      elements.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }, 50)

    return () => clearTimeout(timer)
  }, [])
}