import { Metadata } from 'next';
import { FaShieldAlt, FaCog, FaChartLine, FaLock, FaUserCheck, FaExternalLinkAlt } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Privacy & Cookie Policy | UNBBSS - University of New Brunswick Business Students\' Society',
  description: 'Comprehensive information about our cookie usage, privacy policies, and data protection practices at the University of New Brunswick Business Students\' Society.',
  keywords: 'UNBBSS, cookie policy, privacy policy, data protection, University of New Brunswick, business students society',
  robots: 'index, follow',
  openGraph: {
    title: 'Privacy & Cookie Policy | UNBBSS',
    description: 'Learn about our commitment to privacy and transparent cookie usage practices.',
    type: 'website',
    locale: 'en_CA',
  },
};

const CookieTypeCard = ({ 
  icon, 
  title, 
  description, 
  examples, 
  required = false 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
  required?: boolean;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {required && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              Required
            </span>
          )}
        </div>
        <p className="text-gray-700 mb-4 leading-relaxed">{description}</p>
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Examples:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                {example}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const InfoSection = ({ 
  title, 
  children, 
  className = "" 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <section className={`mb-12 ${className}`}>
    <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-green-600">
      {title}
    </h2>
    {children}
  </section>
);

export default function LearnMore() {
  const lastUpdated = new Date().toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Moncton'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <FaShieldAlt className="text-4xl" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy & Cookie Policy
            </h1>
            <p className="text-xl text-green-100 leading-relaxed max-w-3xl mx-auto">
              Your privacy matters to us. Learn how the University of New Brunswick Business Students' Society 
              protects your data and uses cookies to enhance your experience.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        
        {/* Introduction */}
        <InfoSection title="Our Commitment to Privacy">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start gap-4">
              <FaLock className="text-blue-600 text-2xl flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  The University of New Brunswick Business Students' Society (UNBBSS) is committed to protecting your 
                  privacy and maintaining transparency about our data practices. This comprehensive guide explains how we 
                  use cookies and handle your personal information.
                </p>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* What Are Cookies */}
        <InfoSection title="Understanding Cookies">
          <div className="prose prose-lg max-w-none text-gray-700 mb-8">
            <p className="text-lg leading-relaxed mb-6">
              Cookies are small text files stored on your device when you visit our website. They help us provide 
              essential functionality, remember your preferences, and improve your overall experience. Think of them as 
              digital sticky notes that help our website remember you.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUserCheck className="text-green-600" />
                How Cookies Benefit You
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Keep you logged in during your session
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Remember your preferences and settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Provide secure form submissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Help us improve the platform based on usage patterns
                </li>
              </ul>
            </div>
          </div>
        </InfoSection>

        {/* Types of Cookies */}
        <InfoSection title="Types of Cookies We Use">
          <div className="grid gap-8 md:gap-6">
            
            <CookieTypeCard
              icon={<FaShieldAlt className="text-green-600 text-2xl" />}
              title="Essential Cookies"
              description="These cookies are absolutely necessary for our website to function properly. They enable core functionality including security features, authentication, and form submissions."
              examples={[
                "User authentication and login sessions",
                "Security tokens to prevent unauthorized access",
                "Form submission data for nominations and withdrawals",
                "Session management for secure interactions"
              ]}
              required={true}
            />

            <CookieTypeCard
              icon={<FaCog className="text-blue-600 text-2xl" />}
              title="Functional Cookies"
              description="These cookies enhance your experience by remembering your choices and preferences, making your interactions with our website more personalized and efficient."
              examples={[
                "Language and region preferences",
                "Display settings and theme choices",
                "Navigation preferences and bookmarks",
                "Previously entered form information"
              ]}
            />

            <CookieTypeCard
              icon={<FaChartLine className="text-purple-600 text-2xl" />}
              title="Analytics Cookies"
              description="These cookies help us understand how visitors interact with our website by collecting anonymous information about usage patterns and popular features."
              examples={[
                "Page views and user flow analysis",
                "Feature usage statistics",
                "Performance monitoring and error tracking",
                "General demographic insights (no personal data)"
              ]}
            />
          </div>
        </InfoSection>

        {/* Your Rights and Choices */}
        <InfoSection title="Your Rights and Choices">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cookie Management</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  You have complete control over your cookie preferences. You can:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    Accept or reject non-essential cookies at any time
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    Modify your preferences through our cookie banner
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    Clear existing cookies through your browser settings
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Impact of Your Choices</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2 font-medium">
                    ⚠️ Please Note:
                  </p>
                  <p className="text-sm text-yellow-700 leading-relaxed">
                    Disabling functional or analytics cookies may limit some features of our website, 
                    but essential cookies will always remain active to ensure basic functionality and security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* Data Security and Privacy */}
        <InfoSection title="Data Security and Privacy">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaLock className="text-green-600" />
                Our Security Promise
              </h3>
              <ul className="space-y-3 text-green-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  All data is processed and stored locally on our secure servers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  We never sell, rent, or share your personal information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Industry-standard encryption protects data in transit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  Regular security audits and updates maintain protection
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Data Retention</h3>
              <p className="text-blue-700 mb-4 leading-relaxed">
                We retain your data only as long as necessary for the purposes outlined in this policy:
              </p>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Preference cookies:</strong> Stored for up to 1 year</li>
                <li><strong>Analytics data:</strong> Aggregated and anonymized after 6 months</li>
              </ul>
            </div>
          </div>
        </InfoSection>

        {/* Contact and Legal */}
        <InfoSection title="Questions and Contact Information">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Have Questions?</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  We're here to help clarify any aspect of our privacy practices or cookie usage. 
                  Don't hesitate to reach out if you need assistance.
                </p>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <a href="mailto:privacy@unbbss.ca" className="text-green-600 hover:text-green-700 underline">
                      privacy@unbbss.ca
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Phone:</span>
                    <a href="tel:+1-506-458-7671" className="text-green-600 hover:text-green-700">
                      (506) 458-7671
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Related Policies</h3>
                <div className="space-y-3">
                  <a 
                    href="/privacy-policy" 
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group"
                  >
                    Privacy Policy
                    <FaExternalLinkAlt className="text-sm group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                  <a 
                    href="/terms-of-service" 
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group"
                  >
                    Terms of Service
                    <FaExternalLinkAlt className="text-sm group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                  <a 
                    href="/data-protection" 
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group"
                  >
                    Data Protection Statement
                    <FaExternalLinkAlt className="text-sm group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </InfoSection>

        {/* Browser Settings Guide */}
        <InfoSection title="Managing Cookies in Your Browser">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-gray-700 mb-6 leading-relaxed">
              You can also manage cookies directly through your web browser. Here are links to cookie management 
              guides for popular browsers:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                { name: 'Firefox', url: 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop' },
                { name: 'Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac' },
                { name: 'Edge', url: 'https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies' }
              ].map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200 group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-green-700">
                    {browser.name}
                  </span>
                  <FaExternalLinkAlt className="text-xs text-gray-400 group-hover:text-green-600" />
                </a>
              ))}
            </div>
          </div>
        </InfoSection>

        {/* Updates and Changes */}
        <InfoSection title="Policy Updates">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              We may occasionally update this cookie policy to reflect changes in our practices, technology, 
              legal requirements, or other factors. When we make significant changes, we will:
            </p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                Notify you through a prominent notice on our website
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                Update the "Last Updated" date at the bottom of this page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                Request renewed consent for any new cookie categories
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              We encourage you to review this policy periodically to stay informed about how we protect your privacy.
            </p>
          </div>
        </InfoSection>

        {/* Footer Information */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  University of New Brunswick Business Students' Society
                </h3>
                <p className="text-sm text-gray-600">
                  Committed to transparency, privacy, and student success since 1964
                </p>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <p><strong>Last Updated:</strong> {lastUpdated}</p>
                <p><strong>Version:</strong> 2.1</p>
                <p><strong>Next Review:</strong> {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { 
                  year: 'numeric', 
                  month: 'long',
                  timeZone: 'America/Moncton'
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-green-600 text-white rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Customize Your Experience?</h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Take control of your privacy preferences and enjoy a personalized experience tailored to your needs.
            </p>
            <button 
              onClick={() => {
                // This would trigger the cookie consent banner to reappear
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('unbbss_cookie_consent');
                  window.location.reload();
                }
              }}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 shadow-lg"
            >
              Update Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}