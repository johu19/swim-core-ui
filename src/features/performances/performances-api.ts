import { apiClient } from '@/lib/api/api-client'

export type Performance = {
  distance?: number | string | null
  id?: string | number | null
  performedAt?: string | null
  performanceId?: string | number | null
  poolLength?: number | string | null
  poolLengthUnit?: string | null
  splits?: number[] | null
  sourceType?: string | null
  stroke?: string | null
  timeMs?: number | string | null
  [key: string]: unknown
}

export type CreatePerformanceInput = {
  distance: number
  performedAt: string
  poolLength: number
  poolLengthUnit: 'meters' | 'yards'
  splits?: number[]
  sourceType: 'competition' | 'training'
  stroke: 'freestyle' | 'backstroke' | 'butterfly' | 'breaststroke' | 'medley'
  timeMs: number
}

export type UpdatePerformanceInput = CreatePerformanceInput

export type CreatePerformanceResponse =
  | Performance
  | {
      performance?: Performance | null
    }

type PerformancesResponse = {
  performances: Performance[]
}

export const performancesApi = {
  getPerformances() {
    return apiClient.get<PerformancesResponse>('/performances')
  },
  createPerformance(input: CreatePerformanceInput) {
    return apiClient.post<CreatePerformanceResponse | void>('/performances', input)
  },
  updatePerformance(performanceId: string | number, input: UpdatePerformanceInput) {
    return apiClient.patch<CreatePerformanceResponse | void>(
      `/performances/${performanceId}`,
      input,
    )
  },
  deletePerformance(performanceId: string | number) {
    return apiClient.delete<void>(`/performances/${performanceId}`)
  },
}
