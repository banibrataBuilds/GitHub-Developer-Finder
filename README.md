# GitHub Developer Finder 🔍

A modern, highly responsive web application to search and discover GitHub developer profiles. Built with a beautiful glassmorphism design, it fetches live data from the GitHub REST API and presents comprehensive developer statistics, highlighting top repositories and language usage.

## ✨ Features

- **Live GitHub API Integration:** Fetches real-time profile details, public repositories, and external social accounts.
- **Resume-Worthy Developer Stats:**
  - **Top Languages:** Calculates the most frequently used programming languages across the developer's repositories.
  - **Total Stars:** Aggregates total stars earned across the latest repositories.
  - **Contribution Activity:** Renders the developer's public 52-week GitHub contribution heatmap.
- **Beautiful UI/UX:**
  - Stunning Glassmorphism aesthetic with soft shadows and animated gradients.
  - Fully responsive layout for Desktop, Tablet, and Mobile.
  - Built-in Dark Mode and Light Mode toggles.
  - Elegant skeleton loading states and robust error handling (e.g., rate limits, user not found).
- **Search History:** Automatically saves recent searches locally and displays them as quick-access clickable chips.
- **Native Sharing:** Built-in Web Share API integration and one-click URL copying.

## 🛠️ Tech Stack

- **Structure:** HTML5
- **Styling:** Vanilla CSS3 (Custom Variables, Flexbox, CSS Grid, Glassmorphism)
- **Logic:** Vanilla JavaScript (ES6+, Async/Await, Fetch API, LocalStorage)
- **Icons:** FontAwesome (Brands & Solids)
- **Fonts:** Google Fonts (Inter & Outfit)

## 🚀 Getting Started

Since this project is built entirely with Vanilla HTML, CSS, and JS, there are no heavy frameworks or build steps required. 

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/github-developer-finder.git
   cd github-developer-finder
   ```

2. **Run the application:**
   You have a few simple options to run the app:
   
   - **Option A (Direct):** Simply double-click the `index.html` file to open it in your browser.
   - **Option B (VS Code):** If you use VS Code, right-click `index.html` and select **"Open with Live Server"**.
   - **Option C (Node.js):** If you have Node installed, you can serve the directory locally:
     ```bash
     npx serve .
     ```
     Then open `http://localhost:3000` in your browser.

## 📈 API Limitations

This application uses the public, unauthenticated GitHub REST API. 
- You are limited to **60 requests per hour** per IP address.
- The contribution heatmap graph is generated via `ghchart.rshah.org` and only displays **public** repository contributions. It may differ slightly from an authenticated user's GitHub overview which includes private activity.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
