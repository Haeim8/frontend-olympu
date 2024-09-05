import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, Twitter, MessageCircle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Importer ConnectButton

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [formData, setFormData] = useState({
    photo: '',
    username: '',
    xAccount: '',
    socialMedia: ''
  })

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target) {
          setFormData(prev => ({ ...prev, photo: event.target?.result }))
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setShowSignup(false)
  }

  return (
    (<div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative overflow-hidden">
        {/* Starry background */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill={darkMode ? "#0f172a" : "#f1f5f9"} />
            {[...Array(100)].map((_, i) => (
              <motion.circle
                key={i}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r={Math.random() * 2}
                fill={darkMode ? "#ffffff" : "#000000"}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: Math.random() * 6 + 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }} />
            ))}
          </svg>
        </div>

        {/* Success constellation */}
        <svg className="absolute inset-0 z-0" xmlns="http://www.w3.org/2000/svg">
          <g stroke={darkMode ? "#4287f5" : "#1652F0"} strokeWidth="0.5" fill="none">
            <motion.path
              d="M20,20 L40,40 L60,30 L80,50 L100,40"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 6, ease: "easeInOut" }} />
            <motion.circle
              cx="20"
              cy="20"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }} />
            <motion.circle
              cx="40"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }} />
            <motion.circle
              cx="60"
              cy="30"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3 }} />
            <motion.circle
              cx="80"
              cy="50"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 4 }} />
            <motion.circle
              cx="100"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 5 }} />
          </g>
        </svg>
        
        {/* Animated laser bridge */}
        <motion.div
          className="absolute inset-0 z-0 opacity-20"
          initial={{ pathLength: 0, pathOffset: 1 }}
          animate={{ pathLength: 1, pathOffset: 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none">
            <motion.path
              d="M0,50 Q50,0 100,50 Q50,100 0,50"
              stroke={darkMode ? "#4287f5" : "#1652F0"}
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0, pathOffset: 1 }}
              animate={{ pathLength: 1, pathOffset: 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
          </svg>
        </motion.div>
        
        <header className="px-4 lg:px-6 h-20 flex items-center justify-between relative z-10 bg-transparent">
          <div className="flex items-center">
            {/* Logo placeholder */}
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <MessageCircle size={20} />
              <span className="sr-only">Discord</span>
            </a>

            {/* Bouton de connexion Wallet */}
            <ConnectButton />
          </div>
        </header>

        <main className="flex-1 relative z-10 flex items-center justify-center">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <motion.div
                className="space-y-4 text-center max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}>
                <motion.div
                  className="inline-block rounded-lg bg-blue-600 px-3 py-1 text-sm text-white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                  Defi Crowdfunding 
                </motion.div>
                <motion.div
                  className="p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}>
                  <motion.h1
                    className="text-3xl font-bold tracking-tighter md:text-4xl/tight mb-4"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    Support the future of the internet.
                  </motion.h1>
                  <motion.p
                    className="max-w-[600px] text-gray-700 dark:text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}>
                    Contribute to the development of cutting-edge Web3 technologies and be a part of the decentralized revolution.
                  </motion.p>
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}>
                    <Button
                      variant="default"
                      className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      onClick={() => setShowSignup(true)}>
                      Create Account
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 relative z-10 bg-transparent">
          <p className="text-xs text-gray-600 dark:text-gray-400">&copy; 2024 Acme Web3. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4">
              Terms of Service
            </a>
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4">
              Privacy
            </a>
          </nav>
        </footer>
      </div>
      <AnimatePresence>
        {showSignup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}>
              <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex justify-between items-center">
                    Create Account
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setShowSignup(false)}>
                      <X size={24} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="photo"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</Label>
                      <Input
                        id="photo"
                        name="photo"
                        type="file"
                        onChange={handlePhotoChange}
                        className="mt-1" />
                      {formData.photo && (
                        <img
                          src={formData.photo}
                          alt="Profile preview"
                          className="mt-2 w-20 h-20 object-cover rounded-full" />
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="mt-1" />
                    </div>
                    <div>
                      <Label
                        htmlFor="xAccount"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">X Account</Label>
                      <Input
                        id="xAccount"
                        name="xAccount"
                        value={formData.xAccount}
                        onChange={handleInputChange}
                        className="mt-1" />
                    </div>
                    <div>
                      <Label
                        htmlFor="socialMedia"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other Social Media</Label>
                      <Input
                        id="socialMedia"
                        name="socialMedia"
                        value={formData.socialMedia}
                        onChange={handleInputChange}
                        className="mt-1" />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Create Account</Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>)
  );
}
