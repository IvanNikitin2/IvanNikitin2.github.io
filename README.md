# 🎸 Guitar Lessons Website

A modern, responsive, mobile-first guitar lessons website designed for GitHub Pages. Features a beautiful intro animation, lesson booking, progress tracking, and a personal learning journal.

## ✨ Features

### Intro Experience
- Full-screen typing animation with a warm welcome message
- Smooth fade transition into the main content
- Shows only once per visitor (stored in localStorage)

### Learning Progress
- Visual circular progress indicator showing remaining hours (default: 30 hours)
- Tracks completed hours and total lessons taken
- Option to request additional learning hours

### Lesson Booking
- Mobile-optimized date and time pickers
- Custom message field for lesson requests
- Validates time intervals and available hours
- Immediate visual feedback with toast notifications

### Learning Journal
- Timeline-style lesson history
- Each lesson displays date, duration, and description
- Editable notes section for reflections and practice goals
- Auto-saves notes as you type

### Thoughtful Enhancements
- **Time-aware greetings**: "Good morning/afternoon/evening" based on current time
- **Motivational quotes**: Random inspiring messages that change throughout the day
- **Dark mode support**: Automatically respects system preferences
- **Reduced motion**: Respects user preferences for reduced animations

## 🛠 Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Flexbox, Grid, modern animations
- **Vanilla JavaScript** - No dependencies, modular architecture
- **LocalStorage** - Client-side data persistence
- **Google Fonts** - Inter & Playfair Display typography

## 📱 Responsive Design

- Mobile-first approach with fluid typography
- Touch-friendly controls (44px minimum touch targets)
- Prevents iOS zoom on form inputs
- Adapts fluidly from phones to tablets to desktops

## 🚀 Getting Started

1. Clone or fork this repository
2. Open `index.html` in a browser, or
3. Deploy to GitHub Pages:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder

## 📁 Project Structure

```
├── index.html      # Main HTML structure
├── style.css       # Complete styling with CSS variables
├── main.js         # Application logic and state management
└── README.md       # This file
```

## 🎨 Customization

### Colors
Edit CSS variables in `:root` within `style.css`:
```css
--color-accent: #6c5ce7;      /* Primary accent color */
--color-primary: #2d3436;     /* Text and button color */
```

### Default Hours
Edit `CONFIG.DEFAULT_HOURS` in `main.js`:
```javascript
const CONFIG = {
    DEFAULT_HOURS: 30,  // Change this value
    // ...
};
```

### Motivational Quotes
Add or modify quotes in the `MOTIVATIONAL_QUOTES` array in `main.js`.

## 📄 License

Feel free to use this project for personal or educational purposes.

---

Made with 🎵 for your musical journey