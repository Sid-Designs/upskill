import React from 'react';

const CookiePolicyPage = () => {
  return (
    <main className="bg-white mt-6 md:mt-8 lg:mt-12">
      {/* Main container: responsive padding */}
      <div className="max-w-3xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-22">
        
        {/* Header */}
        <header className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500 border-b border-gray-200 pb-5">
            Effective: February 12, 2026
          </p>
        </header>

        {/* Content – fully responsive, clean spacing */}
        <div className="text-gray-700 space-y-8 sm:space-y-10">
          
          <section className="space-y-3">
            <p className="text-base sm:text-lg leading-relaxed text-gray-600">
              This Cookie Policy explains how UpSkill uses cookies and similar technologies to recognise you when you visit our platform. It explains what these technologies are, why we use them, and your rights to control our use of them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">1. What Are Cookies?</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site. Cookies do not typically contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">2. Why We Use Cookies</h2>
            <p className="text-sm sm:text-base text-gray-700">
              We use cookies for several purposes, including:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li><span className="font-medium text-gray-900">Essential / Strictly Necessary Cookies:</span> These cookies are required for the platform to function. They enable you to log in, navigate, and use core features such as accessing your dashboard, generating roadmaps, and saving your progress.</li>
              <li><span className="font-medium text-gray-900">Functional Cookies:</span> These cookies remember your preferences (e.g., language, region) and enhance your experience by personalising content.</li>
              <li><span className="font-medium text-gray-900">Analytics & Performance Cookies:</span> We use these cookies to understand how visitors interact with our platform, measure traffic, and identify areas for improvement. We use tools like Google Analytics and Vercel Analytics.</li>
              <li><span className="font-medium text-gray-900">Marketing Cookies:</span> These cookies track your activity across websites to deliver relevant advertisements and measure the effectiveness of our marketing campaigns.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">3. Third‑Party Cookies</h2>
            <p className="text-sm sm:text-base text-gray-700">
              In addition to our own cookies, we may also use various third‑party cookies to report usage statistics, deliver advertisements, and process payments. These cookies are set by domains other than our own. Third parties we work with include:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Google Analytics (analytics)</li>
              <li>Vercel (performance & analytics)</li>
              <li>Razorpay (payment processing – these cookies are essential for completing transactions)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">4. How to Control Cookies</h2>
            <p className="text-sm sm:text-base text-gray-700">
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li><span className="font-medium text-gray-900">Browser Settings:</span> Most web browsers allow you to manage cookies through their settings. You can block or delete cookies, but please note that disabling essential cookies may affect the functionality of the platform.</li>
              <li><span className="font-medium text-gray-900">Cookie Consent Banner:</span> When you first visit our platform, we display a banner that allows you to accept or decline non‑essential cookies. You can change your preferences at any time by clicking the "Cookie Settings" link in the footer of our website.</li>
              <li><span className="font-medium text-gray-900">Opt‑out Tools:</span> You can opt out of Google Analytics by installing the Google Analytics Opt‑out Browser Add‑on.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">5. Duration of Storage</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Cookies can be either "session cookies" or "persistent cookies". Session cookies are deleted automatically when you close your browser, while persistent cookies remain on your device until they expire or you delete them. We use both types. The specific duration of each cookie is detailed in our Cookie Consent Manager.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">6. Updates to This Policy</h2>
            <p className="text-sm sm:text-base text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We encourage you to review this page periodically. The "Effective" date at the top indicates when this policy was last revised.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">7. Contact Us</h2>
            <p className="text-sm sm:text-base text-gray-700">
              If you have any questions about our use of cookies or this policy, please contact us at:
              <br />
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-1 break-all">
                contact@siddheshdev.com
              </span>
            </p>
          </section>

          <section className="text-xs sm:text-sm text-gray-500 pt-6 sm:pt-8 border-t border-gray-200">
            <p>
              By continuing to use our platform, you consent to our use of cookies as described in this policy.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CookiePolicyPage;