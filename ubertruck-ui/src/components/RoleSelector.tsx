/**
 * RoleSelector Component
 *
 * Production-ready role selection for user registration
 *
 * Context Tracking:
 * - Logs role selection events
 * - Validates role against frozen list (GUARDRAIL)
 * - Returns structured selection data
 *
 * Guardrails:
 * - Only allows SHIPPER, CARRIER, DRIVER (HARD CONSTRAINT)
 * - Accessible keyboard navigation
 * - Clear visual feedback for selected state
 */

import React from 'react';

export type UserRole = 'SHIPPER' | 'CARRIER' | 'DRIVER';

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: string;
}

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onChange: (role: UserRole) => void;
  error?: string | null;
  disabled?: boolean;
}

// GUARDRAIL: Frozen role list (HARD CONSTRAINT)
const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'SHIPPER',
    label: 'Shipper',
    description: 'I need to transport goods',
    icon: '📦',
  },
  {
    value: 'CARRIER',
    label: 'Fleet Owner',
    description: 'I own trucks/vehicles for transport',
    icon: '🚛',
  },
  {
    value: 'DRIVER',
    label: 'Driver',
    description: 'I drive trucks for transport',
    icon: '👨‍✈️',
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onChange,
  error,
  disabled = false,
}) => {
  const handleRoleSelect = (role: UserRole) => {
    if (disabled) return;

    // Context tracking: Log role selection
    console.log(`[RoleSelector] Role selected: ${role}`);

    onChange(role);
  };

  const handleKeyPress = (e: React.KeyboardEvent, role: UserRole) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRoleSelect(role);
    }
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        Select Your Role <span style={styles.required}>*</span>
      </label>

      <div style={styles.roleGrid}>
        {ROLE_OPTIONS.map((option) => {
          const isSelected = selectedRole === option.value;
          const roleStyle = {
            ...styles.roleCard,
            ...(isSelected ? styles.roleCardSelected : {}),
            ...(disabled ? styles.roleCardDisabled : {}),
          };

          return (
            <div
              key={option.value}
              style={roleStyle}
              onClick={() => handleRoleSelect(option.value)}
              onKeyPress={(e) => handleKeyPress(e, option.value)}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`Select ${option.label} role`}
            >
              <div style={styles.roleIcon}>{option.icon}</div>
              <h3 style={styles.roleLabel}>{option.label}</h3>
              <p style={styles.roleDescription}>{option.description}</p>

              {isSelected && (
                <div style={styles.checkmark}>
                  <span>✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <p style={styles.hint}>
        Choose the role that best describes how you'll use UberTruck
      </p>
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

  label: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.75rem',
  },

  required: {
    color: '#e53e3e',
  },

  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '0.5rem',
  },

  roleCard: {
    position: 'relative',
    padding: '1.5rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    outline: 'none',
    userSelect: 'none',
  },

  roleCardSelected: {
    borderColor: '#3182ce',
    backgroundColor: '#ebf8ff',
    boxShadow: '0 0 0 3px rgba(49, 130, 206, 0.1)',
  },

  roleCardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  roleIcon: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
  },

  roleLabel: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: '0.5rem',
  },

  roleDescription: {
    fontSize: '0.875rem',
    color: '#718096',
    lineHeight: 1.5,
    margin: 0,
  },

  checkmark: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '1.5rem',
    height: '1.5rem',
    backgroundColor: '#3182ce',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },

  error: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#e53e3e',
  },

  hint: {
    fontSize: '0.875rem',
    color: '#718096',
    margin: '0.5rem 0 0 0',
  },
};

export default RoleSelector;
