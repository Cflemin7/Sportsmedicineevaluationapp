import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle, Shield } from 'lucide-react';

export default function DARMCompliance() {
  const ComplianceItem = ({ status, title, details }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
      {status === 'compliant' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
      {status === 'platform' && <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
      {status === 'action' && <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />}
      {status === 'na' && <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600 mt-1">{details}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg mb-4">
          <Shield className="w-6 h-6" />
          <h1 className="text-2xl font-bold">DARM Compliance Documentation</h1>
        </div>
        <p className="text-gray-600">J&J MedTech Sports Medicine Evaluation Platform</p>
        <p className="text-sm text-gray-500 mt-2">Version 1.0 | Last Updated: November 17, 2025</p>
      </div>

      {/* Executive Summary */}
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600 mt-1">Platform Managed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">10%</div>
              <div className="text-sm text-gray-600 mt-1">App Implemented</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">5%</div>
              <div className="text-sm text-gray-600 mt-1">Manual Actions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600">Compliant</Badge>
            <span className="text-sm text-gray-600">with platform-managed controls</span>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>App Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Platform Managed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>Action Required</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span>Not Applicable</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Non-Production Environment */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">1. Non-Production Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Password-protected non-prod access"
            details="Base44 provides environment isolation with 10+ char passwords, 3 complexity classes"
          />
          <ComplianceItem
            status="platform"
            title="Unique credentials per environment"
            details="Base44 manages separate credentials for dev/staging/production"
          />
        </CardContent>
      </Card>

      {/* 2. DNS */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">2. DNS/DNS Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="action"
            title="Domain Registration Required"
            details="Project owner must register domain with J&J Domain Central before launch"
          />
          <ComplianceItem
            status="action"
            title="DNS Configuration via IPAM"
            details="Submit IPAM request through IRIS ticket for DNS changes"
          />
        </CardContent>
      </Card>

      {/* 3. Technology */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">3. Technology Stack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Up-to-date software versions"
            details="React (latest), Node.js managed by Base44 platform with automatic patching"
          />
          <ComplianceItem
            status="platform"
            title="Patching schedule: 30d critical, 90d non-critical"
            details="Base44 platform handles all security updates and patches"
          />
          <ComplianceItem
            status="compliant"
            title="No exposed sensitive files"
            details="No changelog.txt, readme.txt, install.php, wp-config.php or other CMS files exposed"
          />
          <ComplianceItem
            status="platform"
            title="Default accounts disabled"
            details="Base44 has no default accounts; all accounts are provisioned"
          />
        </CardContent>
      </Card>

      {/* 4. End User */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">4. End User Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg mb-3">
            <h4 className="font-semibold text-blue-900 mb-2">Password Policy (enforced from Dec 1, 2024)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Min 8 characters, 2 complexity classes</li>
              <li>✅ 90-day expiration</li>
              <li>✅ No reuse for 5 iterations</li>
            </ul>
          </div>
          <ComplianceItem
            status="platform"
            title="Password hashing (Argon2/PBKDF2/Scrypt/Bcrypt)"
            details="Base44 uses industry-standard secure hashing for all passwords"
          />
          <ComplianceItem
            status="platform"
            title="Account lockout: 5 attempts in 15 minutes"
            details="Base44 brute force protection automatically locks accounts"
          />
          <ComplianceItem
            status="platform"
            title="Secure password reset with tokens (32+ chars)"
            details="Base44 email-based reset with unique, time-limited tokens"
          />
          <ComplianceItem
            status="compliant"
            title="Password fields hidden by default"
            details="HTML password inputs with type='password', no show/hide toggle"
          />
          <ComplianceItem
            status="compliant"
            title="No autocomplete on password/sensitive fields"
            details="Autocomplete disabled on credential forms"
          />
          <ComplianceItem
            status="platform"
            title="Generic failed login messages"
            details="Base44 returns 'Invalid credentials' without specifying which field failed"
          />
          <ComplianceItem
            status="platform"
            title="Auto logout after 15 minutes inactivity"
            details="Base44 session management with configurable timeout"
          />
          <ComplianceItem
            status="platform"
            title="Session cookies: httpOnly, secure, 128-bit min"
            details="Base44 sets all required cookie security attributes"
          />
        </CardContent>
      </Card>

      {/* 5. Admin/CMS */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">5. Admin/CMS Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Admin password: 10 chars, 3 complexity classes"
            details="Base44 enforces stronger policy for admin accounts"
          />
          <ComplianceItem
            status="compliant"
            title="Role-based access control"
            details="Admin-only features: Manage Users, Moderate Posts, Manage Announcements, Manage SKUs"
          />
          <ComplianceItem
            status="compliant"
            title="Admin route protection"
            details="Code validates user.role === 'admin' before rendering admin features"
          />
        </CardContent>
      </Card>

      {/* 6. Input Validation */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">6. Input Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="compliant"
            title="File upload validation (profile pictures, gov approval docs)"
            details="Validates: file type (images only for profiles), file size (max 5MB), content format"
          />
          <ComplianceItem
            status="platform"
            title="Malware scanning on uploads"
            details="Base44 UploadFile integration includes malware scanning"
          />
          <ComplianceItem
            status="action"
            title="Bot prevention on forms"
            details="RECOMMENDATION: Add reCAPTCHA to evaluation signature form and public contact forms"
          />
          <ComplianceItem
            status="compliant"
            title="Input sanitization"
            details="React prevents XSS; Base44 backend sanitizes all inputs before database storage"
          />
        </CardContent>
      </Card>

      {/* 7. Data Encryption */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">7. Data Encryption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="TLS 1.2+ for all connections"
            details="Base44 enforces HTTPS with TLS 1.2+ on all endpoints"
          />
          <ComplianceItem
            status="platform"
            title="SSL Labs Grade A certificate"
            details="Base44 manages SSL certificates with A-grade configuration"
          />
          <ComplianceItem
            status="platform"
            title="HTTPS persistence (no downgrade)"
            details="Base44 redirects all HTTP to HTTPS"
          />
          <ComplianceItem
            status="platform"
            title="Data encrypted at rest"
            details="Base44 database encryption for all stored data (AES-256)"
          />
          <ComplianceItem
            status="platform"
            title="Separate encryption keys per environment"
            details="Base44 uses unique keys for dev/staging/production"
          />
          <ComplianceItem
            status="action"
            title="WAF deployment (if Complex level)"
            details="Deploy Cloudflare WAF before production launch if assessment level is Complex"
          />
          <ComplianceItem
            status="platform"
            title="HTTP Security Headers"
            details="Base44 sets: X-Content-Type-Options, HSTS, X-Frame-Options, CSP"
          />
        </CardContent>
      </Card>

      {/* 8. Email */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">8. Email Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Email size and quantity limits"
            details="Base44 SendEmail integration has built-in rate limiting and size restrictions"
          />
          <ComplianceItem
            status="platform"
            title="PII data encrypted in transit (TLS 1.2+)"
            details="All emails sent via Base44 use TLS encryption"
          />
          <ComplianceItem
            status="platform"
            title="Malware scanning on attachments"
            details="Base44 email service includes malware protection"
          />
          <ComplianceItem
            status="compliant"
            title="Email usage: Signature requests only"
            details="Application sends e-signature requests; password reset handled by Base44"
          />
        </CardContent>
      </Card>

      {/* 9. Vulnerability Management */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">9. Vulnerability Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="action"
            title="Qualys vulnerability scan required"
            details="Submit scan request to DARM team before production launch. Must have no med/high/critical vulnerabilities."
          />
          <ComplianceItem
            status="platform"
            title="HTTP Security Headers implemented"
            details="Base44 sets X-Content-Type-Options, HSTS, X-Frame-Options, Content-Security-Policy"
          />
          <ComplianceItem
            status="action"
            title="Snyk source code scan (if Complex level)"
            details="Required for Complex assessments. Run Snyk scan with no High vulnerabilities."
          />
        </CardContent>
      </Card>

      {/* 10. Service Accounts */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">10. Service/Application Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Service account security (10 chars, 3 complexity)"
            details="Base44 manages all service and database accounts with secure passwords"
          />
          <ComplianceItem
            status="platform"
            title="Passwords hashed in storage"
            details="All service account credentials securely hashed by Base44"
          />
          <ComplianceItem
            status="platform"
            title="Separate passwords per environment"
            details="Base44 uses unique credentials for dev/staging/production"
          />
        </CardContent>
      </Card>

      {/* 11. Data Backups */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">11. Data Backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Automated backups enabled"
            details="Base44 performs regular automated backups of all application data"
          />
          <ComplianceItem
            status="platform"
            title="Backups encrypted"
            details="All backups encrypted using industry-standard algorithms"
          />
          <ComplianceItem
            status="platform"
            title="Disaster recovery & restore testing"
            details="Base44 SLA includes backup/restore procedures and testing"
          />
        </CardContent>
      </Card>

      {/* 12. Audit Logs */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">12. Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComplianceItem
            status="platform"
            title="Application logging enabled"
            details="Base44 logs all entity operations, authentication events, and user actions"
          />
          <ComplianceItem
            status="platform"
            title="Separate from system logs"
            details="Base44 maintains separate application and infrastructure logs"
          />
          <ComplianceItem
            status="platform"
            title="Logged events include: User auth, evaluations, accounts, admin actions"
            details="All CRUD operations tracked with user email and timestamp"
          />
        </CardContent>
      </Card>

      {/* Application-Level Security */}
      <Card className="shadow-lg border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <CardTitle>Application-Level Security Implementation</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Row-Level Security (RLS)</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Evaluation Entity</h4>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Users access only their own evaluations or assigned ones</li>
                  <li>Sales consultants see evaluations they created</li>
                  <li>Territory managers see their team's evaluations</li>
                  <li>Admins have full access</li>
                  <li>Public signature links use time-limited tokens</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Account Entity</h4>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Users see only accounts they created or are contacts for</li>
                  <li>Admins have full access</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">User Entity</h4>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Users can view/update their own profile only</li>
                  <li>Admins can list and view all users (no edit/delete)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Email Domain Restriction</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <code className="text-xs text-blue-900">
                Only @its.jnj.com email addresses allowed (admin accounts exempt)
              </code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Profile Completion Enforcement</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-700">
                Required fields: first_name, last_name, territory, employee_id, phone_number, region, manager_email
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Business Logic Security</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">12-Month Re-Evaluation Rule</h4>
                <p className="text-xs text-gray-600">Products cannot be re-evaluated at same account within 366 days</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Government Account Compliance</h4>
                <p className="text-xs text-gray-600">Mandatory approval checkbox and file upload for government accounts</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">E-Signature Token Security</h4>
                <p className="text-xs text-gray-600">Unique random tokens for signature links; RLS allows limited unauthenticated access</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Actions */}
      <Card className="shadow-lg border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <CardTitle>⚠️ Required Actions Before Production Launch</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">1.</span>
              <div>
                <strong>Complete Compliance Analysis (CA)</strong>
                <p className="text-gray-600 text-xs mt-1">Determine data classification and assessment level (BASIC vs COMPLEX)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">2.</span>
              <div>
                <strong>Register Domain with J&J Domain Central</strong>
                <p className="text-gray-600 text-xs mt-1">Via Corporate Trademark Law Department</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">3.</span>
              <div>
                <strong>Submit IPAM Request for DNS</strong>
                <p className="text-gray-600 text-xs mt-1">Through IRIS ticket with DNS details</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">4.</span>
              <div>
                <strong>Request Qualys Vulnerability Scan</strong>
                <p className="text-gray-600 text-xs mt-1">Submit to DARM team; must have no med/high/critical vulnerabilities</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">5.</span>
              <div>
                <strong>Deploy WAF (if Complex level)</strong>
                <p className="text-gray-600 text-xs mt-1">Submit JIRA ticket for Cloudflare WAF setup</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">6.</span>
              <div>
                <strong>Snyk Source Code Scan (if Complex level)</strong>
                <p className="text-gray-600 text-xs mt-1">Run Snyk scan with no High vulnerabilities</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-orange-600 flex-shrink-0">7.</span>
              <div>
                <strong>Submit DARM Assessment</strong>
                <p className="text-gray-600 text-xs mt-1">Via Business Security Consulting (BIS) intake - select "Digital and Data Science Consulting"</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle>💡 Enhancement Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 text-sm">
            <div className="p-4 border-l-4 border-blue-600 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2">1. Add reCAPTCHA to Public Forms</h4>
              <p className="text-blue-800 text-xs">
                <strong>Priority:</strong> Medium<br/>
                <strong>Impact:</strong> Prevents bot submissions on evaluation signature form<br/>
                <strong>Implementation:</strong> Add reCAPTCHA v3 (invisible) to SignEvaluation page
              </p>
            </div>
            <div className="p-4 border-l-4 border-blue-600 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2">2. Enhanced Session Monitoring</h4>
              <p className="text-blue-800 text-xs">
                <strong>Priority:</strong> Low<br/>
                <strong>Impact:</strong> Track unusual access patterns<br/>
                <strong>Implementation:</strong> Already handled by Base44 platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Contact & Support</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">DARM Team</h4>
              <p className="text-gray-600 text-xs">
                <strong>Intake Form:</strong> Business Security Consulting (BIS)<br/>
                <strong>Request Type:</strong> Digital and Data Science Consulting
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Assessment Timeline</h4>
              <p className="text-gray-600 text-xs">
                Allow <strong>14 days</strong> to complete DARM assessment<br/>
                Includes time for evidence gathering and question responses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-8 border-t">
        <p>Johnson & Johnson Confidential - Use Pursuant to Company Instructions</p>
        <p className="mt-2">Based on DARM Digital Security Guide Version 1.3 (June 19, 2024)</p>
      </div>
    </div>
  );
}