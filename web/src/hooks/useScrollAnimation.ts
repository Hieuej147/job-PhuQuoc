"use client"

import { useEffect } from "react"

export function useScrollAnimation(deps: unknown[] = []) {
  useEffect(() => {
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
      elements.forEach((el) => {
        el.classList.remove("visible") // Reset trước
        observer.observe(el)
      })

      return () => observer.disconnect()
    }, 50)

    return () => clearTimeout(timer)
  }, deps) // deps thay đổi thì chạy lại
}