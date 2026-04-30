import { describe, it, expect } from 'vitest';
import {
  validators,
  combineValidators,
  validateForm,
  validationSchemas,
} from './validators';

describe('validators', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email('test@example.com')).toBeNull();
      expect(validators.email('user.name+tag@example.co.uk')).toBeNull();
    });

    it('should reject invalid email', () => {
      expect(validators.email('invalid')).not.toBeNull();
      expect(validators.email('invalid@')).not.toBeNull();
      expect(validators.email('@example.com')).not.toBeNull();
    });

    it('should allow empty value', () => {
      expect(validators.email('')).toBeNull();
      expect(validators.email('   ')).toBeNull();
    });
  });

  describe('invitationCode', () => {
    it('should validate correct invitation code', () => {
      expect(validators.invitationCode('ABCDEF')).toBeNull();
      expect(validators.invitationCode('ABC123')).toBeNull();
      expect(validators.invitationCode('ABCDEF123456')).toBeNull();
    });

    it('should reject invalid invitation code', () => {
      expect(validators.invitationCode('abc')).not.toBeNull();
      expect(validators.invitationCode('abcdef')).not.toBeNull();
      expect(validators.invitationCode('ABC')).not.toBeNull();
    });
  });

  describe('invitationUrl', () => {
    it('should validate correct URL', () => {
      expect(validators.invitationUrl('https://example.com/invite')).toBeNull();
      expect(validators.invitationUrl('http://example.com')).toBeNull();
    });

    it('should reject invalid URL', () => {
      expect(validators.invitationUrl('not a url')).not.toBeNull();
      expect(validators.invitationUrl('example.com')).not.toBeNull();
    });
  });

  describe('invitationLinkOrCode', () => {
    it('should accept valid URL', () => {
      expect(validators.invitationLinkOrCode('https://example.com/invite')).toBeNull();
    });

    it('should accept valid code', () => {
      expect(validators.invitationLinkOrCode('ABCDEF')).toBeNull();
    });

    it('should reject invalid input', () => {
      expect(validators.invitationLinkOrCode('invalid')).not.toBeNull();
      expect(validators.invitationLinkOrCode('abc')).not.toBeNull();
    });
  });

  describe('phoneNumber', () => {
    it('should validate correct phone number', () => {
      expect(validators.phoneNumber('1234567890')).toBeNull();
      expect(validators.phoneNumber('12345678901234')).toBeNull();
    });

    it('should reject invalid phone number', () => {
      expect(validators.phoneNumber('123')).not.toBeNull();
      expect(validators.phoneNumber('abc1234567')).not.toBeNull();
    });
  });

  describe('url', () => {
    it('should validate correct URL', () => {
      expect(validators.url('https://example.com')).toBeNull();
      expect(validators.url('http://example.com:8080/path')).toBeNull();
    });

    it('should reject invalid URL', () => {
      expect(validators.url('not a url')).not.toBeNull();
      expect(validators.url('example.com')).not.toBeNull();
    });
  });

  describe('apiKey', () => {
    it('should validate correct API key', () => {
      expect(validators.apiKey('abcdefghij')).toBeNull();
      expect(validators.apiKey('sk_live_1234567890')).toBeNull();
    });

    it('should reject short API key', () => {
      expect(validators.apiKey('short')).not.toBeNull();
    });
  });

  describe('password', () => {
    it('should validate strong password', () => {
      expect(validators.password('StrongPass123!')).toBeNull();
      expect(validators.password('MyPassword@2024')).toBeNull();
    });

    it('should reject weak password', () => {
      expect(validators.password('short')).not.toBeNull();
      expect(validators.password('onlyletters')).not.toBeNull();
      expect(validators.password('12345678')).not.toBeNull();
    });
  });

  describe('username', () => {
    it('should validate correct username', () => {
      expect(validators.username('user123')).toBeNull();
      expect(validators.username('user_name')).toBeNull();
      expect(validators.username('user-name')).toBeNull();
    });

    it('should reject invalid username', () => {
      expect(validators.username('ab')).not.toBeNull();
      expect(validators.username('user@name')).not.toBeNull();
      expect(validators.username('a'.repeat(21))).not.toBeNull();
    });
  });

  describe('number', () => {
    it('should validate numbers', () => {
      expect(validators.number('123')).toBeNull();
      expect(validators.number('-123')).toBeNull();
      expect(validators.number('123.45')).toBeNull();
    });

    it('should reject non-numbers', () => {
      expect(validators.number('abc')).not.toBeNull();
      expect(validators.number('12.34.56')).not.toBeNull();
    });
  });

  describe('positiveInteger', () => {
    it('should validate positive integers', () => {
      expect(validators.positiveInteger('1')).toBeNull();
      expect(validators.positiveInteger('123')).toBeNull();
    });

    it('should reject non-positive integers', () => {
      expect(validators.positiveInteger('0')).not.toBeNull();
      expect(validators.positiveInteger('-1')).not.toBeNull();
      expect(validators.positiveInteger('1.5')).not.toBeNull();
    });
  });

  describe('nonNegativeInteger', () => {
    it('should validate non-negative integers', () => {
      expect(validators.nonNegativeInteger('0')).toBeNull();
      expect(validators.nonNegativeInteger('123')).toBeNull();
    });

    it('should reject negative integers', () => {
      expect(validators.nonNegativeInteger('-1')).not.toBeNull();
      expect(validators.nonNegativeInteger('1.5')).not.toBeNull();
    });
  });

  describe('cardKey', () => {
    it('should validate card key', () => {
      expect(validators.cardKey('ABCDEF1234')).toBeNull();
      expect(validators.cardKey('ABC123DEF456')).toBeNull();
    });

    it('should reject invalid card key', () => {
      expect(validators.cardKey('abc')).not.toBeNull();
      expect(validators.cardKey('ABC')).not.toBeNull();
      expect(validators.cardKey('abc123')).not.toBeNull();
    });
  });

  describe('ipAddress', () => {
    it('should validate correct IP address', () => {
      expect(validators.ipAddress('192.168.1.1')).toBeNull();
      expect(validators.ipAddress('0.0.0.0')).toBeNull();
      expect(validators.ipAddress('255.255.255.255')).toBeNull();
    });

    it('should reject invalid IP address', () => {
      expect(validators.ipAddress('256.1.1.1')).not.toBeNull();
      expect(validators.ipAddress('192.168.1')).not.toBeNull();
      expect(validators.ipAddress('192.168.1.1.1')).not.toBeNull();
    });
  });

  describe('port', () => {
    it('should validate correct port', () => {
      expect(validators.port('80')).toBeNull();
      expect(validators.port('8080')).toBeNull();
      expect(validators.port('65535')).toBeNull();
    });

    it('should reject invalid port', () => {
      expect(validators.port('0')).not.toBeNull();
      expect(validators.port('65536')).not.toBeNull();
      expect(validators.port('abc')).not.toBeNull();
    });
  });

  describe('required', () => {
    it('should accept non-empty string', () => {
      expect(validators.required('value')).toBeNull();
    });

    it('should reject empty string', () => {
      expect(validators.required('')).not.toBeNull();
      expect(validators.required('   ')).not.toBeNull();
    });
  });

  describe('minLength', () => {
    it('should validate minimum length', () => {
      const validator = validators.minLength(5);
      expect(validator('hello')).toBeNull();
      expect(validator('hello world')).toBeNull();
    });

    it('should reject short string', () => {
      const validator = validators.minLength(5);
      expect(validator('hi')).not.toBeNull();
    });
  });

  describe('maxLength', () => {
    it('should validate maximum length', () => {
      const validator = validators.maxLength(5);
      expect(validator('hello')).toBeNull();
      expect(validator('hi')).toBeNull();
    });

    it('should reject long string', () => {
      const validator = validators.maxLength(5);
      expect(validator('hello world')).not.toBeNull();
    });
  });

  describe('lengthRange', () => {
    it('should validate length range', () => {
      const validator = validators.lengthRange(3, 10);
      expect(validator('hello')).toBeNull();
      expect(validator('abc')).toBeNull();
    });

    it('should reject out of range', () => {
      const validator = validators.lengthRange(3, 10);
      expect(validator('ab')).not.toBeNull();
      expect(validator('abcdefghijk')).not.toBeNull();
    });
  });
});

describe('combineValidators', () => {
  it('should combine multiple validators', () => {
    const validator = combineValidators(
      validators.required,
      validators.minLength(5),
      validators.email
    );

    expect(validator('test@example.com')).toBeNull();
    expect(validator('test')).not.toBeNull();
    expect(validator('ab@c.d')).not.toBeNull();
  });
});

describe('validateForm', () => {
  it('should validate entire form', () => {
    const schema = {
      email: validators.email,
      password: validators.password,
    };

    const data = {
      email: 'test@example.com',
      password: 'StrongPass123!',
    };

    const errors = validateForm(data, schema);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should collect multiple errors', () => {
    const schema = {
      email: validators.email,
      password: validators.password,
    };

    const data = {
      email: 'invalid',
      password: 'weak',
    };

    const errors = validateForm(data, schema);
    expect(Object.keys(errors).length).toBeGreaterThan(0);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe('validationSchemas', () => {
  it('should have registration schema', () => {
    expect(validationSchemas.registration).toBeDefined();
    expect(validationSchemas.registration.email).toBeDefined();
    expect(validationSchemas.registration.password).toBeDefined();
    expect(validationSchemas.registration.username).toBeDefined();
  });

  it('should have invitation schema', () => {
    expect(validationSchemas.invitation).toBeDefined();
    expect(validationSchemas.invitation.invitationLink).toBeDefined();
  });

  it('should have proxyConfig schema', () => {
    expect(validationSchemas.proxyConfig).toBeDefined();
    expect(validationSchemas.proxyConfig.proxyUrl).toBeDefined();
    expect(validationSchemas.proxyConfig.port).toBeDefined();
  });

  it('should have apiConfig schema', () => {
    expect(validationSchemas.apiConfig).toBeDefined();
    expect(validationSchemas.apiConfig.apiUrl).toBeDefined();
    expect(validationSchemas.apiConfig.apiKey).toBeDefined();
  });
});
