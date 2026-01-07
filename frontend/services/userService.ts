import apiClient from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { User, Address } from "@/lib/types";

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>(endpoints.users.profile);
    return response.data;
  },

  getUsers: async (role?: string): Promise<User[]> => {
    const params = role ? `?role=${role}` : "";
    const response = await apiClient.get<User[]>(
      `${endpoints.users.list}${params}`
    );
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(endpoints.users.detail(id));
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(endpoints.users.profile, data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(
      endpoints.users.update(id),
      data
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.users.delete(id));
  },

  addAddress: async (
    address: Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Address> => {
    // Send address data directly
    const response = await apiClient.post<Address>(
      endpoints.users.addresses,
      address
    );
    return response.data;
  },

  updateAddress: async (
    addressId: string,
    address: Partial<Address>
  ): Promise<Address> => {
    // Send address data directly
    const response = await apiClient.put<Address>(
      endpoints.users.address(addressId),
      address
    );
    return response.data;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    await apiClient.delete(endpoints.users.address(addressId));
  },

  setDefaultAddress: async (addressId: string): Promise<Address> => {
    const response = await apiClient.put<Address>(
      endpoints.users.setDefaultAddress(addressId),
      {}
    );
    return response.data;
  },
};
