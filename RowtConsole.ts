import axios, { AxiosInstance, AxiosResponse } from "axios";

interface LoginDTO {
  email: string;
  password: string;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
}

class RowtConsole {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Include cookies
    });
  }

  async login(credentials: LoginDTO): Promise<void> {
    try {
      await this.client.post("/auth/login", credentials);
      console.log("Login successful!");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Login failed");
      } else {
        throw new Error("Login failed due to an unexpected error");
      }
    }
  }
}

export default RowtConsole;
