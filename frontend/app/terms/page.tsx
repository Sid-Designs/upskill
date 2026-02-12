import React from 'react';

const TermsOfServicePage = () => {
  return (
    <main className="bg-white mt-6 md:mt-8 lg:mt-12">
      {/* Main container: responsive padding */}
      <div className="max-w-3xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-22">
        
        {/* Header */}
        <header className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500 border-b border-gray-200 pb-5">
            Effective: February 12, 2026
          </p>
        </header>

        {/* Content – fully responsive, clean spacing */}
        <div className="text-gray-700 space-y-8 sm:space-y-10">
          
          <section className="space-y-3">
            <p className="text-base sm:text-lg leading-relaxed text-gray-600">
              Welcome to UpSkill. By accessing or using our AI‑powered career guidance platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">1. Acceptance of Terms</h2>
            <p className="text-sm sm:text-base text-gray-700">
              By creating an account, accessing, or using UpSkill, you confirm that you accept these Terms and that you agree to comply with them. If you do not agree, you must not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">2. Description of Service</h2>
            <p className="text-sm sm:text-base text-gray-700">
              UpSkill provides an AI‑driven career development platform that includes, but is not limited to:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Personalized career roadmaps and skill gap analysis.</li>
              <li>AI‑generated cover letters and application materials.</li>
              <li>Capstone project recommendations and feedback.</li>
              <li>Verified professional certification.</li>
              <li>Portfolio building tools.</li>
              <li>Interview preparation and career coaching resources.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">3. User Accounts</h2>
            <p className="text-sm sm:text-base text-gray-700">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, complete, and up‑to‑date information. You must be at least 16 years old to use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">4. User Content</h2>
            <p className="text-sm sm:text-base text-gray-700">
              You retain ownership of any content you submit to UpSkill (e.g., profile information, work history, goals). By submitting content, you grant us a worldwide, royalty‑free license to use, reproduce, and process such content solely for the purpose of providing and improving our services. We never share your personal content without your explicit consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">5. AI‑Generated Content</h2>
            <p className="text-sm sm:text-base text-gray-700">
              UpSkill uses artificial intelligence to generate personalized recommendations, documents, and feedback. AI‑generated content is provided as a starting point and may contain errors or inaccuracies. You are solely responsible for reviewing, editing, and deciding how to use any AI‑generated outputs. UpSkill does not guarantee the accuracy, completeness, or suitability of AI‑generated content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">6. Intellectual Property</h2>
            <p className="text-sm sm:text-base text-gray-700">
              All platform content not provided by users—including software, design, text, graphics, logos, and AI models—is the exclusive property of UpSkill and is protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of our platform without our prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">7. Payments and Subscriptions</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Certain features may require payment. If you purchase a subscription, you agree to pay the applicable fees. Subscription fees are non‑refundable except as required by law or as expressly stated in our refund policy. We may change our prices with reasonable notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">8. Cancellation and Refunds</h2>
            <p className="text-sm sm:text-base text-gray-700">
              You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. No partial refunds are provided. If you believe you are entitled to a refund, please contact us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">9. Prohibited Conduct</h2>
            <p className="text-sm sm:text-base text-gray-700">You agree not to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>Use the platform for any illegal or unauthorized purpose.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on the rights of others.</li>
              <li>Upload or transmit viruses, malware, or other harmful code.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Use automated means (bots, scrapers) to access the platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">10. Third‑Party Links</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Our platform may contain links to third‑party websites or services. We are not responsible for the content, privacy policies, or practices of any third parties. Your use of third‑party sites is at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">11. Disclaimer of Warranties</h2>
            <p className="text-sm sm:text-base text-gray-700">
              UpSkill is provided &quot;as is&quot; and &quot;as available&quot; without any warranties, express or implied. We do not guarantee that the platform will be uninterrupted, error‑free, or secure, or that any AI‑generated content will lead to specific career outcomes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">12. Limitation of Liability</h2>
            <p className="text-sm sm:text-base text-gray-700">
              To the maximum extent permitted by law, UpSkill shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the platform. Our total liability shall not exceed the amount you paid us during the twelve months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">13. Indemnification</h2>
            <p className="text-sm sm:text-base text-gray-700">
              You agree to indemnify and hold harmless UpSkill, its affiliates, and their respective officers, directors, employees, and agents from any claims, losses, liabilities, damages, expenses, and costs arising out of your use of the platform, violation of these Terms, or infringement of any third‑party rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">14. Termination</h2>
            <p className="text-sm sm:text-base text-gray-700">
              We may suspend or terminate your access to UpSkill at any time, with or without cause, with or without notice. Upon termination, your right to use the platform will immediately cease. You may delete your account at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">15. Governing Law</h2>
            <p className="text-sm sm:text-base text-gray-700">
              These Terms shall be governed by the laws of [Your Country/State], without regard to its conflict of law provisions. Any legal disputes shall be resolved exclusively in the courts located in [Your City/Region].
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">16. Changes to These Terms</h2>
            <p className="text-sm sm:text-base text-gray-700">
              We may update these Terms from time to time. If we make material changes, we will notify you via email or through a prominent notice on our website. Your continued use of the platform after the effective date constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900">17. Contact</h2>
            <p className="text-sm sm:text-base text-gray-700">
              If you have any questions about these Terms, please contact us at:
              <br />
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-1 break-all">
                contact@siddheshdev.com
              </span>
            </p>
          </section>

          <section className="text-xs sm:text-sm text-gray-500 pt-6 sm:pt-8 border-t border-gray-200">
            <p>
              These Terms of Service constitute the entire agreement between you and UpSkill regarding your use of the platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default TermsOfServicePage;