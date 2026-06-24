import { apiClient } from '@/lib/api/api-client'

export type Profile = {
  birthDate?: string | null
  email?: string | null
  favStroke?: string | null
  firstName?: string | null
  gender?: string | null
  lastName?: string | null
  profileId?: string | null
  teamName?: string | null
  [key: string]: unknown
}

export type UpdateProfileInput = {
  birthDate: string
  email: string
  favStroke: '' | 'freestyle' | 'butterfly' | 'breastroke' | 'backstroke' | 'medley'
  firstName: string
  gender: string
  lastName: string
  teamName: string
}

type ProfileResponse = {
  profile: Profile
}

export const profileApi = {
  getMeProfile() {
    return apiClient.get<ProfileResponse>('/me/profile')
  },
  updateMeProfile(input: UpdateProfileInput) {
    return apiClient.patch<ProfileResponse | void>('/me/profile', input)
  },
}
