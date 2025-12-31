import { Radio, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { UserMenu } from "./UserMenu"

export function AppHeader() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemDark ? "light" : "dark")
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radio className="h-4 w-4" />
        </div>
        <span>Ponix</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}
