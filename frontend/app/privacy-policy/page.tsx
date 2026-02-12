import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <main className="bg-white mt-6 md:mt-8 lg:mt-12">
      {/* Main container: responsive padding */}
      <div className="max-w-3xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-22">
        
        {/* Header */}
        <header className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500 border-b border-gray-200 pb-5">
            Effective: February 12, 2026
          </p>
        </header>

        {/* Content – fully responsive, clean spacing */}
        <div className="text-gray-700 space-y-8 sm:space-y-10">
          
          <section className="space-y-3">
            <p className="text-base sm:text-lg leading-relaxed text-gray-600">
              At UpSkill, your privacy is our priority. This policy explains how we collect, use, and protect your information when you use our AI‑powered career guidance platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">1. Information We Collect</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li><span className="font-medium text-gray-900">Personal Information:</span> Name, email, profile photo, and any details you add.</li>
              <li><span className="font-medium text-gray-900">Career & Skills Data:</span> Work history, education, skills, goals, target roles.</li>
              <li><span className="font-medium text-gray-900">AI‑Generated Content:</span> Roadmaps, cover letters, project feedback, certificates.</li>
              <li><span className="font-medium text-gray-900">Usage & Device Data:</span> IP address, browser type, pages visited, feature interactions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Create and deliver personalized career roadmaps and learning plans.</li>
              <li>Generate custom cover letters and application materials.</li>
              <li>Assess skill gaps and recommend capstone projects.</li>
              <li>Issue verified certificates and support portfolio building.</li>
              <li>Improve our AI models and personalize your experience.</li>
              <li>Communicate updates, new features, and support.</li>
              <li>Ensure security, prevent fraud, and enforce terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">3. AI & Automated Decisions</h2>
            <p className="text-sm sm:text-base text-gray-700">Our AI analyzes your profile to generate personalized guidance. This includes:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Identifying skill gaps and suggesting learning resources.</li>
              <li>Creating tailored cover letters based on your experience.</li>
              <li>Recommending projects and providing feedback.</li>
              <li>Assessing readiness and issuing certification.</li>
            </ul>
            <p className="mt-3 text-sm sm:text-base text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
              You can always edit, reject, or request human review of AI‑generated content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">4. Sharing & Disclosure</h2>
            <p className="text-sm sm:text-base text-gray-700">We do not sell your personal information. Limited sharing occurs only:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li><span className="font-medium text-gray-900">With your consent:</span> e.g., sharing your portfolio or certificate.</li>
              <li><span className="font-medium text-gray-900">Service providers:</span> trusted partners bound by confidentiality.</li>
              <li><span className="font-medium text-gray-900">Legal requirements:</span> if required by law or to protect rights.</li>
              <li><span className="font-medium text-gray-900">Business transfers:</span> with notice in case of merger or acquisition.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">5. Data Security & Retention</h2>
            <p className="text-sm sm:text-base text-gray-700">
              We use encryption, access controls, and regular audits to protect your data. We retain your information while your account is active. You may delete your account at any time; data is removed within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">6. Your Rights</h2>
            <p className="text-sm sm:text-base text-gray-700">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Access and export your data.</li>
              <li>Correct inaccurate information.</li>
              <li>Delete your account and associated data.</li>
              <li>Opt out of non‑essential communications.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">7. Contact</h2>
            <p className="text-sm sm:text-base text-gray-700">
              For questions or concerns, contact us at:<br />
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-1 break-all">
                contact@siddheshdev.com
              </span>
            </p>
          </section>

          <section className="text-xs sm:text-sm text-gray-500 pt-6 sm:pt-8 border-t border-gray-200">
            <p>
              We may update this policy from time to time. Material changes will be notified via email or website notice.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;