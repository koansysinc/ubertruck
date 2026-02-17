/**
 * TermsAgreement Component
 *
 * Production-ready terms & conditions agreement checkbox
 *
 * Context Tracking:
 * - Logs agreement acceptance/revocation
 * - Tracks user interactions
 *
 * Guardrails:
 * - Required for registration (HARD CONSTRAINT)
 * - Accessible with keyboard navigation
 * - Clear visual feedback
 */

import React from 'react';

interface TermsAgreementProps {
  agreed: boolean;
  onChange: (agreed: boolean) => void;
  error?: string | null;
  disabled?: boolean;
}

export const TermsAgreement: React.FC<TermsAgreementProps> = ({
  agreed,
  onChange,
  error,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    // Context tracking: Log agreement action
    if (checked) {
      console.log('[TermsAgreement] User agreed to terms');
    } else {
      console.log('[TermsAgreement] User revoked agreement');
    }

    onChange(checked);
  };

  return (
    <div style={styles.container}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={handleChange}
          disabled={disabled}
          style={styles.checkbox}
          aria-invalid={!!error}
          aria-describedby={error ? 'terms-error' : undefined}
        />
        <span style={styles.labelText}>
          I agree to the{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Terms & Conditions
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Privacy Policy
          </a>
          <span style={styles.required}> *</span>
        </span>
      </label>

      {error && (
        <div id="terms-error" style={styles.error} role="alert">
          {error}
        </div>
      )}

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          📋 <strong>Key Points:</strong>
        </p>
        <ul style={styles.infoList}>
          <li>Your data is secure and encrypted</li>
          <li>You can update or delete your account anytime</li>
          <li>No hidden fees or charges</li>
          <li>24/7 customer support available</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================================================
// Styles (Inline for zero external dependencies)
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    marginBottom: '1.5rem',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    userSelect: 'none',
  },

  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    marginRight: '0.75rem',
    marginTop: '0.125rem',
    cursor: 'pointer',
    flexShrink: 0,
  },

  labelText: {
    fontSize: '0.9375rem',
    color: '#2d3748',
    lineHeight: 1.6,
  },

  required: {
    color: '#e53e3e',
  },

  link: {
    color: '#3182ce',
    textDecoration: 'underline',
    fontWeight: 500,
  },

  error: {
    marginTop: '0.5rem',
    marginLeft: '2rem',
    fontSize: '0.875rem',
    color: '#e53e3e',
  },

  infoBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f7fafc',
    borderRadius: '0.375rem',
    borderLeft: '4px solid #3182ce',
  },

  infoText: {
    fontSize: '0.875rem',
    color: '#2d3748',
    margin: '0 0 0.5rem 0',
    fontWeight: 600,
  },

  infoList: {
    margin: 0,
    paddingLeft: '1.25rem',
    fontSize: '0.875rem',
    color: '#4a5568',
    lineHeight: 1.8,
  },
};

export default TermsAgreement;
