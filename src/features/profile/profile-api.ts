import { apiClient } from '@/lib/api/api-client'

export type Profile = Record<string, unknown>

export const profileApi = {
  getMeProfile() {
    return apiClient.get<Profile>('/me/profile')
  },
}
