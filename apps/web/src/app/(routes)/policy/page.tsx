import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Privacy Notice',
  description: 'Terms of Service and Privacy Notice for PackYourBag',
};

export default function Page() {
  return (
    <div className="bg-surface flex flex-col gap-4 p-4 pb-32 md:p-6">
      <h1 className="text-primary text-xl font-semibold">Terms &amp; Privacy Notice</h1>

      {/* Terms of Service */}

      <h2 className="text-primary border-primary-ring border-b pb-2 text-base font-semibold">
        Terms of Service
      </h2>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Your account</h3>
        <p className="text-foreground text-sm">
          You are responsible for keeping your password secure and for all activity that takes place
          under your account. If you suspect unauthorised access, change your password immediately.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Your content</h3>
        <p className="text-foreground text-sm">
          Any trips, packs, collections and items you create belong to you. We do not claim
          ownership of your data. We store it solely to provide the service to you.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Acceptable use</h3>
        <p className="text-foreground text-sm">
          You agree not to use the service to do anything unlawful, harmful, or abusive. We reserve
          the right to suspend or terminate accounts that violate these terms.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Service availability</h3>
        <p className="text-foreground text-sm">
          We aim to keep PackYourBag available and working, but we do not guarantee uninterrupted
          access or that data will never be lost. Use the service at your own risk.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Changes to these terms</h3>
        <p className="text-foreground text-sm">
          We may update these terms from time to time. If we make significant changes, we will
          notify you by email before they take effect. Continued use of the service after that point
          means you accept the updated terms.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Governing law</h3>
        <p className="text-foreground text-sm">
          These terms are governed by the laws of Belgium. If you are a consumer residing in the EU,
          the mandatory consumer protection laws of your country of residence also apply, and you
          may bring legal proceedings in the courts of your country of residence. If you reside
          outside the EU, these terms are governed exclusively by Belgian law and any disputes will
          be subject to the jurisdiction of the courts of Belgium.
        </p>
      </section>

      {/* Privacy Notice */}

      <h2 className="text-primary border-primary-ring border-b pb-2 text-base font-semibold">
        Privacy Notice
      </h2>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">What we store</h3>
        <p className="text-foreground text-sm">
          Your email address and a securely hashed password — we never store your password in
          plaintext. We also store your in-app preferences (display settings, units) and any trips,
          packs, collections and items you create. All data is stored on servers within the European
          Union.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Session cookie</h3>
        <p className="text-foreground text-sm">
          When you log in, we place a single encrypted cookie (<code>pyb-session</code>) on your
          device to keep you authenticated. It is marked <code>HttpOnly</code> (JavaScript on the
          page cannot read it) and is only transmitted over HTTPS. The cookie contains an encrypted
          authentication token — never your email address or password. It expires when you log out
          or after 14 days.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Activity logging</h3>
        <p className="text-foreground text-sm">
          To protect your account, we log security events such as logins, password changes, and
          session activity. Your IP address is truncated before it is stored, so it cannot be used
          to identify you. We record your browser type and the type of device you used (phone,
          tablet, or computer) — nothing more detailed than that.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Error monitoring</h3>
        <p className="text-foreground text-sm">
          Our servers use Sentry to capture unexpected technical errors. Sentry receives limited
          information: the error, which page caused it, and your browser type. Passwords, email
          addresses, and other sensitive request data are automatically filtered out before anything
          is sent to Sentry. Sentry (sentry.io) acts as a data processor under a Data Processing
          Agreement; data is stored in the EU.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Data retention</h3>
        <p className="text-foreground text-sm">
          Security logs are automatically deleted based on severity — routine events after 30 days,
          warnings after 60 days, critical alerts after 90 days. Expired authentication tokens are
          cleaned up daily.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">Account deletion</h3>
        <p className="text-foreground text-sm">
          You can delete your account at any time. Your account enters a 30-day grace period during
          which you can cancel the deletion via a link sent to your email. After 30 days, your
          account is permanently removed: all personal data is deleted and any remaining security
          logs are de-identified so they can no longer be linked to you.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-primary font-medium">No tracking or advertising</h3>
        <p className="text-foreground text-sm">
          We use no analytics trackers, advertising networks, or third-party tracking cookies of any
          kind.
        </p>
      </section>
    </div>
  );
}
