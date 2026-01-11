import apiClient from '../config/api';
import { User, Address } from '../types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/users/profile');
    return response as User;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const user = await userService.getProfile();
    const response = await apiClient.put(`/users/${user._id}`, data);
    return response as User;
  },

  addAddress: async (address: Address): Promise<User> => {
    const user = await userService.getProfile();
    const addresses = user.addresses || [];
    const updatedUser = await userService.updateProfile({
      addresses: [...addresses, address],
    });
    return updatedUser;
  },

  updateAddress: async (addressId: string, address: Address): Promise<User> => {
    const user = await userService.getProfile();
    const addresses = (user.addresses || []).map(addr =>
      addr._id === addressId ? { ...address, _id: addressId } : addr
    );
    const updatedUser = await userService.updateProfile({ addresses });
    return updatedUser;
  },

  deleteAddress: async (addressId: string): Promise<User> => {
    const user = await userService.getProfile();
    const addresses = (user.addresses || []).filter(addr => addr._id !== addressId);
    const updatedUser = await userService.updateProfile({ addresses });
    return updatedUser;
  },
};

