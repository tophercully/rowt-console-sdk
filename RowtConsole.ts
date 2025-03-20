

interface JWTObject {
    access_token: string;
    refresh_token: string;
}


export class RowtConsole {
  public baseUrl: string | undefined;

  constructor() {
    this.baseUrl = process.env.ROWT_SERVER_URL;
    
    // Ensure baseUrl is defined
    if (!this.baseUrl) {
      console.error("ROWT_SERVER_URL environment variable is not defined!");
      // Use a default URL or throw an error based on your requirements
      // this.baseUrl = "http://localhost:3000"; // Default fallback
    }
  }

  async POST(endpointUrl: string, bodyData: any): Promise<Response> {
    try {
      if (!this.baseUrl) {
        throw new Error("Base URL is not defined. Check ROWT_SERVER_URL environment variable.");
      }
      
      const response = await fetch(this.baseUrl + endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async GET(endpointUrl: string): Promise<Response> {
    try {
      if (!this.baseUrl) {
        throw new Error("Base URL is not defined. Check ROWT_SERVER_URL environment variable.");
      }
      
      const response = await fetch(this.baseUrl + endpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async authorizedPOST(endpointUrl: string, data: any): Promise<Response> {
    try {
      if (!this.baseUrl) {
        throw new Error("Base URL is not defined. Check ROWT_SERVER_URL environment variable.");
      }
      
      const response = await fetch(this.baseUrl + endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401 && localStorage.getItem("refresh_token")) {
        await this.refreshAccessToken();

        const retryResponse = await fetch(this.baseUrl + endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(data),
        });

        if (!retryResponse.ok) {
          throw new Error(
            `Request failed after retry with status: ${retryResponse.status}`,
          );
        }

        return retryResponse;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async authorizedGET(endpointUrl: string): Promise<Response> {
    try {
      if (!this.baseUrl) {
        throw new Error("Base URL is not defined. Check ROWT_SERVER_URL environment variable.");
      }
      
      const response = await fetch(this.baseUrl + endpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.status === 401 && localStorage.getItem("refresh_token")) {
        await this.refreshAccessToken();

        const retryResponse = await fetch(this.baseUrl + endpointUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(
            `Request failed after retry with status: ${retryResponse.status}`,
          );
        }

        return retryResponse;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async handleResponse(
    response: Response,
  ): Promise<{ data?: any; error?: Error }> {
    try {
      if (!response.ok) {
        let errorMessage = `Request failed with status: ${response.status}`;

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage += `, message: ${errorData.message || "Unknown error"}`;
          } catch (error) {
            console.error("Failed to parse error response as JSON:", error);
          }
        }

        return { error: new Error(errorMessage) };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("An unknown error occurred"),
      };
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.POST("/login", { username, password });
    const { data, error } = await this.handleResponse(response);

    if (error) {
      throw error;
    }

    if (!data.access_token || !data.refresh_token) {
      throw new Error("Response missing access_token or refresh_token");
    }

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  async refreshAccessToken(): Promise<void> {
    const response = await this.POST("/refresh", {
      refresh_token: localStorage.getItem("refresh_token"),
    });

    const { data, error } = await this.handleResponse(response);

    if (error) {
      throw error;
    }

    if (!data.access_token) {
      throw new Error("Response missing access_token");
    }

    localStorage.setItem("access_token", data.access_token);
  }

  async logout(): Promise<void> {
    const response = await this.POST("/logout", {
      refresh_token: localStorage.getItem("refresh_token"),
    });

    const { error } = await this.handleResponse(response);

    if (error) {
      throw error;
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  async createUser(email: string, password: string): Promise<JWTObject> {
    const response = await this.POST("/users/create", { email, password });
    const { data, error } = await this.handleResponse(response);

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteAccount(): Promise<void> {
    const response = await this.authorizedPOST("/users/delete", {});
    const { error } = await this.handleResponse(response);

    if (error) {
      throw error;
    }
  }
}