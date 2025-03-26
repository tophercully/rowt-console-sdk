import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  RowtGetProjectOptions,
  RowtLoginDTO,
  RowtLoginResponseDTO,
  RowtProject,
  RowtTokens,
  RowtUpdatePasswordDTO,
  RowtUser,
} from "./types";

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
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Use a Promise-based synchronization mechanism
        return this.handleTokenRefresh(() =>
          this.client.request({ method, url, data }),
        );
      }

      throw error;
    }
  }

  private async handleTokenRefresh<T>(
    retryRequest: () => Promise<T>,
  ): Promise<T> {
    // Ensure only one refresh happens at a time
    if (this.isRefreshing) {
      // Wait for the ongoing refresh to complete
      await new Promise<void>((resolve) => {
        const checkRefreshStatus = () => {
          if (!this.isRefreshing) {
            resolve();
          } else {
            setTimeout(checkRefreshStatus, 100);
          }
        };
        checkRefreshStatus();
      });

      // Retry the original request
      return retryRequest();
    }

    try {
      // Prevent multiple simultaneous refreshes
      this.isRefreshing = true;

      try {
        await this.refreshToken();
      } catch (refreshError) {
        // Clear tokens on refresh failure
        this.clearTokens();
        throw new Error("Session expired. Please log in again.");
      } finally {
        // Ensure isRefreshing is reset
        this.isRefreshing = false;
      }

      // Retry the original request
      return retryRequest();
    } catch (error) {
      // Clear tokens if retry fails
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Logs in and stores tokens in localStorage.
   */
  async login(credentials: RowtLoginDTO): Promise<RowtUser> {
    try {
      const response: AxiosResponse<RowtLoginResponseDTO> =
        await this.client.post("/auth/login", credentials);
      console.log(response.data);
      this.storeTokens(response.data.tokens);
      return response.data.user;
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
      const tokens = {
        access_token: localStorage.getItem("access_token"),
        refresh_token: localStorage.getItem("refresh_token"),
      };

      await this.client.post("/auth/logout", tokens, {
        headers: {
          "Content-Type": "application/json",
          Authorization: undefined, // Ensure this request is unauthenticated
        },
      });
    } finally {
      this.clearTokens();
      return "Logout successful";
    }
  }

  /**
   * Creates a new user with the given email and password.
   */
  async createUser(email: string, password: string): Promise<RowtUser> {
    try {
      const response: AxiosResponse<RowtUser> = await this.client.post(
        "/auth/signup",
        { email, password },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data.message || "Failed to create user",
        );
      }
      throw new Error("An unknown error occurred while creating user");
    }
  }

  /**
   * Refreshes the access token and stores the new tokens.
   */
  private async refreshToken(): Promise<void> {
    try {
      console.log("Refreshing token...");
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response: AxiosResponse<RowtTokens> = await this.client.post(
        "/auth/refresh",
        { refresh_token: refreshToken },
        {
          // Bypass the usual interceptors for this request
          headers: {
            "Content-Type": "application/json",
            Authorization: undefined,
          },
        },
      );

      // Validate and store new tokens
      const { access_token, refresh_token } = response.data;
      if (!access_token || !refresh_token) {
        throw new Error("Invalid token response");
      }

      this.storeTokens({
        access_token,
        refresh_token,
      });
      console.log("Token refreshed successfully");
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Fetches the user's  .
   */
  async getProfile(): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> = await this.authenticatedRequest(
      "get",
      "/auth/ ",
    );
    return response.data;
  }
  /**
   * Fetches the  Current User.
   */
  async getCurrentUser(): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> = await this.authenticatedRequest(
      "get",
      "/users/currentUser",
    );
    return response.data;
  }

  /**
   * Updates the user's password.
   */
  async updatePassword(
    updatePasswordDTO: RowtUpdatePasswordDTO,
  ): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> = await this.authenticatedRequest(
      "post",
      "/auth/updatepassword",
      updatePasswordDTO,
    );
    return response.data;
  }

  /**
   * Stores tokens in localStorage.
   */
  private storeTokens(tokens: RowtTokens) {
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

  /**
   * Fetches links by project ID.
   */
  async getLinksByProjectId(
    projectId: string,
    includeInteractions: boolean = false,
  ): Promise<any> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    try {
      const payload = { projectId, includeInteractions };
      console.log("Sending payload:", payload); // Log the payload
      const response: AxiosResponse = await this.authenticatedRequest(
        "post",
        "/link/byProjectId",
        payload,
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error);
        throw new Error(
          error.response?.data.message || "Failed to fetch links",
        );
      }
      console.error(error);
      throw new Error("An unknown error occurred while fetching links");
    }
  }

  async getProjectById(
    projectId: string,
    options: RowtGetProjectOptions,
  ): Promise<RowtProject> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const defaultOptions: RowtGetProjectOptions = {
      includeLinks: false,
      includeInteractions: false,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(), // now
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const payload = { id: projectId, options: mergedOptions };
      const response: AxiosResponse<RowtProject> =
        await this.authenticatedRequest("post", `/projects/getById`, payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export default RowtConsole;
