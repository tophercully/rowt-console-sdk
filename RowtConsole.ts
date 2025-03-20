import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

interface LoginDTO {
  email: string;
  password: string;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface UpdatePasswordDTO {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

class RowtConsole {
  private client: AxiosInstance;
  private isRefreshing = false;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Attach the token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Handles API requests with automatic token refresh on 401 errors.
   */
  private async authenticatedRequest(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
  ): Promise<AxiosResponse> {
    try {
      const response = await this.client.request({ method, url, data });
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            await this.refreshToken();
            this.isRefreshing = false;

            // Retry the original request with new token
            return this.client.request({ method, url, data });
          } catch (refreshError) {
            this.isRefreshing = false;
            this.logout();
            throw new Error("Session expired. Please log in again.");
          }
        }
      }

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data.message || "Request failed");
      }
      throw new Error("An unknown error occurred");
    }
  }

  /**
   * Logs in and stores tokens in localStorage.
   */
  async login(credentials: LoginDTO): Promise<string> {
    try {
      const response: AxiosResponse<Tokens> = await this.client.post(
        "/auth/login",
        credentials,
      );
      this.storeTokens(response.data);
      return "success";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data.message || "Login failed");
      }
      throw new Error("An unknown error occurred during login");
    }
  }

  /**
   * Logs out the user and removes tokens.
   */
  async logout(): Promise<string> {
    try {
      await this.authenticatedRequest("post", "/auth/logout");
    } finally {
      this.clearTokens();
      return "Logout successful";
    }
  }

  /**
   * Refreshes the access token and stores the new tokens.
   */
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("No refresh token available");

      const response: AxiosResponse<Tokens> = await this.client.post(
        "/auth/refresh",
        { refresh_token: refreshToken },
      );

      this.storeTokens(response.data);
    } catch (error) {
      this.clearTokens();
      throw new Error("Failed to refresh token");
    }
  }

  /**
   * Fetches the user's profile.
   */
  async getProfile(): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> =
      await this.authenticatedRequest("get", "/auth/profile");
    return response.data;
  }
  /**
   * Fetches the  Current user's profile.
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> =
      await this.authenticatedRequest("get", "/users/currentUserProfile");
    return response.data;
  }

  /**
   * Updates the user's password.
   */
  async updatePassword(
    updatePasswordDTO: UpdatePasswordDTO,
  ): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> =
      await this.authenticatedRequest(
        "post",
        "/auth/updatepassword",
        updatePasswordDTO,
      );
    return response.data;
  }

  /**
   * Stores tokens in localStorage.
   */
  private storeTokens(tokens: Tokens) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  /**
   * Clears tokens from localStorage.
   */
  private clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export default RowtConsole;
