# Portfolio Website

A clean, modern, and fully customizable portfolio website.

## 🎨 Customization Guide

### 1. Personal Information
Edit `index.html` to update:
- **Line 7**: Change the page title
- **Line 12**: Your name in the navigation
- **Line 23**: Your name in the hero section
- **Line 24**: Your subtitle/title (e.g., "Web Developer | Designer")
- **Line 25**: Your tagline

### 2. About Section
- **Lines 37-41**: Replace with your own bio and story

### 3. Projects
Each project card (starting around line 48) contains:
- **Project image**: Replace `.placeholder-image` text or add real images
- **Project title**: Update the `<h3>` tag
- **Description**: Update the `<p>` tag
- **Tags**: Modify the `<span class="tag">` elements
- **Links**: Update `href="#"` with your demo and source code URLs

Add more projects by copying a `.project-card` div.

### 4. Skills
Update the skills lists (lines 112-139):
- Add or remove skills in each category
- Add new categories by copying a `.skill-category` div

### 5. Contact Information
Update your contact details (lines 149-168):
- **Email**: Replace `your.email@example.com`
- **GitHub**: Update the URL and username
- **LinkedIn**: Update the URL and username
- **Twitter**: Update the URL and username

Add more social links by copying a `.contact-item`.

### 6. Colors & Styling
Edit `styles.css` lines 11-20 to change the color scheme:
```css
--primary-color: #6366f1;     /* Main brand color */
--primary-dark: #4f46e5;      /* Darker shade */
--secondary-color: #10b981;   /* Accent color */
```

Change the hero gradient (line 107):
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 7. Adding Project Images
Replace the placeholder with real images:
```html
<div class="project-image">
    <img src="path/to/your/image.jpg" alt="Project description">
</div>
```

## 🚀 How to Use

1. Open `index.html` in any web browser
2. Customize the content following the guide above
3. Host it on:
   - GitHub Pages
   - Netlify
   - Vercel
   - Any web hosting service

## 📱 Features

- Fully responsive design
- Smooth scrolling navigation
- Scroll animations
- Modern gradient hero section
- Clean project showcase
- Easy to customize
- No dependencies required

## 🛠️ Technologies

- HTML5
- CSS3 (CSS Grid, Flexbox)
- Vanilla JavaScript
- No frameworks or libraries needed

Enjoy your new portfolio!
