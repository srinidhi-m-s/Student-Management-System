import { login, register, changePassword } from './authApi';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = { token: 'fake-token', user: { id: 1, email: 'test@example.com' } };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await login('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed login', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(login('wrong@example.com', 'wrongpass')).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('should register successfully with default role', async () => {
      const mockResponse = { token: 'fake-token', user: { id: 1, email: 'new@example.com' } };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await register('new@example.com', 'password123', 'New User');

      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'password123', name: 'New User', role: 'student' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should register with custom role', async () => {
      const mockResponse = { token: 'fake-token', user: { id: 1, email: 'admin@example.com' } };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await register('admin@example.com', 'password123', 'Admin User', 'admin');

      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123', name: 'Admin User', role: 'admin' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed registration', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(register('existing@example.com', 'password123', 'Existing User')).rejects.toThrow('Registration failed');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = { message: 'Password changed successfully' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await changePassword('oldpass', 'newpass', 'fake-token');

      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        },
        body: JSON.stringify({ oldPassword: 'oldpass', newPassword: 'newpass' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error with message on failed password change', async () => {
      const errorMessage = 'Old password is incorrect';
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ message: errorMessage }),
      });

      await expect(changePassword('wrongold', 'newpass', 'fake-token')).rejects.toThrow(errorMessage);
    });

    it('should throw default error on failed password change without message', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(changePassword('oldpass', 'newpass', 'fake-token')).rejects.toThrow('Failed to change password');
    });
  });
});