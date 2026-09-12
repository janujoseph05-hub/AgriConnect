import React from 'react'

const Footer = () => (
  <footer className="site-footer premium-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <h3>AgriConnect</h3>
        <p className="muted">A premium AgriTech marketplace connecting farmers and buyers with market intelligence.</p>
      </div>
      <div className="footer-links">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="#marketplace">Marketplace</a></li>
          <li><a href="#insights">Market Insights</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">© {new Date().getFullYear()} AgriConnect. All rights reserved.</div>
  </footer>
)

export default Footer
