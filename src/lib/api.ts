import { Dog } from "@/types";
import axios from "axios";

export const api = axios.create({
  baseURL: "https://frontend-take-home-service.fetch.com",
  withCredentials: true,
});

export async function searchDogs(params: {
  breeds?: string[];
  zipCodes?: string[];
  ageMin?: number;
  ageMax?: number;
  size?: number;
  from?: number;
  sort?: string;
}) {
  const { data } = await api.get("/dogs/search", { params });
  return data as {
    resultIds: string[];
    total: number;
    next?: string;
    prev?: string;
  };
}

export async function getDogs(ids: string[]): Promise<Dog[]> {
  const { data } = await api.post("/dogs", ids);
  return data;
}
